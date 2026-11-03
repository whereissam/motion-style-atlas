/* batch h5 — Cinematic & Commercial: Surreal Cinema · Found Footage · SaaS Product Motion.
   surreal (Buñuel & Dalí, Deren, Švankmajer, Lynch: dream logic on film) · foundfootage (Conner, Baldwin, Marclay: archival collage) ·
   saas (Linear / Stripe / Vercel-style B2B launch films, fictional product). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette, rrect } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Oswald:wght@500;700&family=Special+Elite&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  // Tapered tube around a polyline (trunks, branches).
  function tube(g, pts, w0, w1) {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1, i / (n - 1));
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    g.beginPath();
    L.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    for (let i = n - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath();
  }
  const bz = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
  const bil = (q, u, v) => [lerp(lerp(q[0][0], q[1][0], u), lerp(q[3][0], q[2][0], u), v), lerp(lerp(q[0][1], q[1][1], u), lerp(q[3][1], q[2][1], u), v)];

  /* =====================================================================
     SURREAL CINEMA — a dream in three rooms. A slow dolly down a curtained
     corridor with a zigzag floor: a hooded figure with a mirror for a face
     crosses and is gone, a golden key floats past us; the door at the end
     opens onto daylight and we are drawn through it into a Magritte sky
     over a Dalí plain, where a door stands alone, a clock melts over a dead
     branch, the key turns (in stop-motion jumps) into a bird cut from sky,
     bowler-hatted men drift upward and an eye opens in the clouds. The
     camera falls into its pupil, the pupil becomes a keyhole, and through
     it: a night street under a noon sky.
     ===================================================================== */
  const SR = {
    sky: '#2f64b0', skyD: '#173d7c', skyHi: '#8fb6df', haze: '#d8e3ea', cloudS: '#aab6cc',
    sand: '#cf9f60', sandD: '#7a5130', sandH: '#e8c891', rock: '#8a6440', rockD: '#5a3d26',
    curtainD: '#3a0408', curtainH: '#d0303a', door: '#e7e0d0', doorS: '#a59b88', floorW: '#e9e2d2', floorB: '#121012',
    gold: '#d8b04e', goldD: '#7d5f22', bark: '#3a2a1e', stone: '#dcd0b8', stoneD: '#a8977a', cream: '#f3ead8', lamp: '#ffd88a',
  };
  const SR_T = { door: [1.7, 2.6], push: [1.9, 3.25], morph: [3.9, 5.0], fly: [5.0, 6.7], eye: [4.5, 5.5], men: 4.9, blink: 6.15, dive: [6.7, 7.75], title: 8.35 };
  const SR_F = 640, SR_VX = 960, SR_VY = 470, SR_Z1 = 12.5;   // corridor focal length, vanishing point, far wall depth
  const SR_CAP = [[0.25, 1.75, 'Once upon a time…'], [3.45, 4.75, 'Around three in the morning'], [5.85, 7.0, 'Sixteen years before']];
  // dolly: an even walk, then pulled ever faster through the door (velocity is continuous at 1.9 s)
  const srCamZ = t => (t < 1.9 ? 1.2 * t : 2.28 + 1.2 * (t - 1.9) + 4.7 * (t - 1.9) * (t - 1.9));
  const srP = (x, y, z, cz) => { const s = SR_F / Math.max(0.05, z - cz); return [SR_VX + x * s, SR_VY + y * s]; };
  const srHz = t => kf(t, [[0, 1350], [2.4, 1300], [4.5, 715]]);   // horizon of the plain: the camera tilts down from cloud to sand

  // Outline tools for the key → bird morph: start at the rightmost point, same winding, equal arc-length resampling.
  function srOrient(pts) {
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    const p = a < 0 ? pts.slice().reverse() : pts.slice();
    let m = 0; p.forEach((q, i) => { if (q[0] > p[m][0]) m = i; });
    return p.slice(m).concat(p.slice(0, m));
  }
  function srResample(pts, n) {
    const L = [0]; for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const tot = L[L.length - 1], out = []; let j = 0;
    for (let k = 0; k < n; k++) {
      const d = k / n * tot; while (L[j + 1] < d) j++;
      const a = pts[j], b = pts[(j + 1) % pts.length], u = (d - L[j]) / ((L[j + 1] - L[j]) || 1);
      out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
    }
    return out;
  }
  function srKeyRaw() {
    const p = [[0.46, -0.035]];
    for (let x = 0.4; x > -0.2; x -= 0.1) p.push([x, -0.035]);
    for (let k = 0; k <= 16; k++) { const a = -0.3 - k / 16 * (TAU - 0.6), lob = 1 + 0.16 * Math.cos(3 * a); p.push([-0.34 + Math.cos(a) * 0.15 * lob, Math.sin(a) * 0.15 * lob]); }
    [[-0.2, 0.035], [0.28, 0.035], [0.28, 0.17], [0.33, 0.17], [0.33, 0.11], [0.38, 0.11], [0.38, 0.17], [0.44, 0.17], [0.44, 0.035], [0.46, 0.035]].forEach(q => p.push(q));
    return p;
  }
  const SR_BIRD = [[-0.50, 0.00], [-0.44, -0.06], [-0.36, -0.06], [-0.26, -0.06], [-0.20, -0.20], [-0.14, -0.38], [-0.04, -0.50], [0.00, -0.40], [0.02, -0.22], [0.06, -0.08], [0.14, -0.24], [0.26, -0.40], [0.34, -0.44], [0.30, -0.26], [0.20, -0.06], [0.30, -0.04], [0.44, -0.10], [0.50, -0.04], [0.46, 0.04], [0.30, 0.06], [0.10, 0.08], [-0.10, 0.08], [-0.28, 0.06], [-0.40, 0.04], [-0.48, 0.03]];

  function srCurtainTex() {
    const cv = offscreen(600, 600), g = cv.getContext('2d');
    for (let x = 0; x < 600; x += 2) {
      const u = x / 600 * TAU, f = 0.5 + 0.3 * Math.sin(u * 10) + 0.14 * Math.sin(u * 23 + 1) + 0.06 * Math.sin(u * 41 + 2);
      g.fillStyle = mixc(SR.curtainD, SR.curtainH, clamp(f)); g.fillRect(x, 0, 2, 600);
    }
    const v = g.createLinearGradient(0, 0, 0, 600);
    v.addColorStop(0, 'rgba(0,0,0,0.7)'); v.addColorStop(0.25, 'rgba(0,0,0,0)'); v.addColorStop(0.85, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = v; g.fillRect(0, 0, 600, 600);
    return cv;
  }
  // Sculpted Magritte cloud: shaded puffs under lit puffs, flattened underside.
  function srCloudSprite(seed, w, h) {
    const cv = offscreen(w, h), g = cv.getContext('2d'), r = rng(seed), n = 13, puffs = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, top = Math.sin(u * PI), rad = h * (0.13 + 0.2 * top * (0.6 + 0.4 * r()));
      puffs.push([w * (0.1 + 0.8 * u) + (r() - 0.5) * w * 0.05, h * 0.72 - rad * (0.4 + 0.9 * top) - r() * h * 0.06, rad]);
    }
    puffs.forEach(([x, y, rad]) => { const sg = g.createRadialGradient(x, y + rad * 0.2, rad * 0.3, x, y + rad * 0.2, rad * 1.05); sg.addColorStop(0, SR.cloudS); sg.addColorStop(1, 'rgba(170,182,204,0)'); g.fillStyle = sg; g.beginPath(); g.arc(x, y + rad * 0.2, rad * 1.05, 0, TAU); g.fill(); });
    puffs.forEach(([x, y, rad]) => {
      const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.4, rad * 0.1, x, y, rad);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.75, '#f1f2f4'); gr.addColorStop(1, 'rgba(241,242,244,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y - rad * 0.12, rad * 1.02, 0, TAU); g.fill();
    });
    g.globalCompositeOperation = 'destination-out';
    const cut = g.createLinearGradient(0, h * 0.66, 0, h * 0.8); cut.addColorStop(0, 'rgba(0,0,0,0)'); cut.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = cut; g.fillRect(0, h * 0.66, w, h);
    return cv;
  }

  // The key or the bird (or something between): an outline in unit space, filled gold or with sky.
  function srShape(c, pts, x, y, s, o = {}) {
    const sx = o.sx ?? 1, rot = o.rot ?? 0, sky = o.sky ?? 0, st = o.st;
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * sx, s);
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    if (sky < 1) {
      const g = c.createLinearGradient(0, -0.2, 0, 0.2); g.addColorStop(0, '#f4dc8a'); g.addColorStop(0.5, SR.gold); g.addColorStop(1, SR.goldD);
      c.globalAlpha = 1 - sky; c.fillStyle = g; c.fill();
    }
    if (sky > 0) {
      c.save(); c.clip(); c.globalAlpha = sky;
      const g = c.createLinearGradient(0, -0.5, 0, 0.1); g.addColorStop(0, SR.sky); g.addColorStop(1, '#b8d3ec');
      c.fillStyle = g; c.fillRect(-0.6, -0.6, 1.2, 0.8);
      if (st) c.drawImage(st.clouds[1], -0.45 + (o.t || 0) * 0.03, -0.32, 0.8, 0.34);
      c.restore();
    }
    c.globalAlpha = 1; c.lineWidth = 1.6 / s; c.strokeStyle = sky > 0.5 ? 'rgba(30,50,90,0.6)' : '#5a4214'; c.stroke();
    if (sky < 0.5) { c.globalAlpha = 1 - sky * 2; c.fillStyle = '#3b2a0e'; c.beginPath(); c.arc(-0.34, 0, 0.055, 0, TAU); c.fill(); }
    c.restore();
  }

  // Deren's hooded figure with a mirror for a face; origin at the hem, s = px per unit (3 units tall).
  function srFigure(c, x, y, s, t, a) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 3.1) * 0.02); c.globalAlpha = a;
    c.fillStyle = '#050405';
    c.beginPath(); c.moveTo(-0.44, 0); c.quadraticCurveTo(-0.52, -1.4, -0.3, -2.3); c.quadraticCurveTo(-0.32, -2.98, 0, -3.02); c.quadraticCurveTo(0.32, -2.98, 0.3, -2.3); c.quadraticCurveTo(0.52, -1.4, 0.44, 0); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0.02, -2.55, 0.15, 0.21, 0, 0, TAU);
    const g = c.createLinearGradient(0, -2.76, 0, -2.34); g.addColorStop(0, '#d9e6f2'); g.addColorStop(0.5, '#8fa9c4'); g.addColorStop(1, '#3d4e66');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(-0.06, -2.68); c.lineTo(0.08, -2.46); c.stroke();
    c.restore();
  }

  function srCorridor(c, t, st) {
    const cz = srCamZ(t), Z1 = SR_Z1, P = (x, y, z) => srP(x, y, z, cz);
    c.fillStyle = '#050304'; c.fillRect(-100, -100, 2120, 1280);
    // far wall: curtain, then the door frame, its opening onto the other world, and the leaf swinging away from us
    const a = P(-3, -2.8, Z1), b = P(3, 2.2, Z1);
    c.drawImage(st.curtain, a[0], a[1], b[0] - a[0], b[1] - a[1]);
    const open = E.ioC(seg(t, SR_T.door[0], SR_T.door[1]));
    const d0 = P(-0.75, -1.3, Z1), d1 = P(0.75, 2.2, Z1), f0 = P(-0.9, -1.45, Z1);
    const f1 = P(0.9, 2.2, Z1);
    c.fillStyle = SR.door; c.fillRect(f0[0], f0[1], f1[0] - f0[0], f1[1] - f0[1]);
    c.fillStyle = '#0a0808'; c.fillRect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]);
    if (open > 0) {
      c.save(); c.beginPath(); c.rect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]); c.clip();
      srPlain(c, t, st);
      c.restore();
    }
    const ang = open * 1.35 + Math.sin(t * 2) * 0.01 * open, ex = -0.75 + 1.5 * Math.cos(ang), ez = Z1 + 1.5 * Math.sin(ang);
    const q = [P(-0.75, -1.3, Z1), P(ex, -1.3, ez), P(ex, 2.2, ez), P(-0.75, 2.2, Z1)];
    poly(c, q); c.fillStyle = mixc(SR.door, '#6f685c', open * 0.55); c.fill();
    c.strokeStyle = 'rgba(60,50,40,0.45)'; c.lineWidth = Math.max(1, 2 * SR_F / (Z1 - cz) / 160);
    [[0.14, 0.86, 0.07, 0.45], [0.14, 0.86, 0.55, 0.93]].forEach(([u0, u1, v0, v1]) => { poly(c, [bil(q, u0, v0), bil(q, u1, v0), bil(q, u1, v1), bil(q, u0, v1)]); c.stroke(); });
    const kn = bil(q, 0.86, 0.56); c.fillStyle = SR.gold; c.beginPath(); c.arc(kn[0], kn[1], Math.max(1.5, 5 * SR_F / (Z1 - cz) / 64), 0, TAU); c.fill();
    // floor: the black-and-white zigzag, clipped to the floor plane
    const fl = [P(-3, 2.2, cz + 0.3), P(3, 2.2, cz + 0.3), P(3, 2.2, Z1), P(-3, 2.2, Z1)];
    c.save(); poly(c, fl); c.fillStyle = SR.floorW; c.fill(); c.clip();
    c.fillStyle = SR.floorB;
    for (let k = Math.floor((cz + 0.6) / 0.6); k * 0.6 < Z1; k++) {
      const z0 = k * 0.6; c.beginPath();
      for (let i = 0; i <= 12; i++) { const p = P(-3 + i * 0.5, 2.2, z0 + (i % 2) * 0.3); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      for (let i = 12; i >= 0; i--) { const p = P(-3 + i * 0.5, 2.2, z0 + 0.3 + (i % 2) * 0.3); c.lineTo(p[0], p[1]); }
      c.closePath(); c.fill();
    }
    // daylight spilling from the open door across the floor
    if (open > 0) {
      const s0 = P(-0.75, 2.2, Z1), s1 = P(0.75, 2.2, Z1), s2 = P(1.6, 2.2, Z1 - 6), s3 = P(-1.6, 2.2, Z1 - 6);
      const lg = c.createLinearGradient(0, s0[1], 0, s3[1]); lg.addColorStop(0, `rgba(230,240,255,${0.55 * open})`); lg.addColorStop(1, 'rgba(230,240,255,0)');
      c.globalCompositeOperation = 'screen'; poly(c, [s0, s1, s2, s3]); c.fillStyle = lg; c.fill();
    }
    c.restore();
    // side walls: the curtain texture laid along each wall in thin perspective slices, breathing in a draught
    [-1, 1].forEach(sd => {
      for (let z = Math.max(0, Math.floor((cz + 0.25) / 0.25) * 0.25); z < Z1; z += 0.25) {
        const o = P(sd * 3, -2.8, z), oz = P(sd * 3, -2.8, z + 0.25), ob = P(sd * 3, 2.2, z);
        let sx = ((z * 120 + 6 * Math.sin(t * 0.8 + z)) % 570 + 570) % 570;
        c.save(); c.transform((oz[0] - o[0]) / 30, (oz[1] - o[1]) / 30, (ob[0] - o[0]) / 600, (ob[1] - o[1]) / 600, o[0], o[1]);
        c.drawImage(st.curtain, sx, 0, 30, 600, 0, 0, 31, 600);
        c.restore();
      }
    });
    // the hooded figure crosses the room at mid depth and walks into the right-hand curtain
    const fu = seg(t, 0.2, 2.3), fx = lerp(-2.4, 3.3, fu), fz = 7.6;
    if (fu > 0 && fu < 1 && fz - cz > 0.5) {
      const p = P(fx, 2.2, fz), s = SR_F / (fz - cz);
      srFigure(c, p[0], p[1] + Math.abs(Math.sin(t * 3.1)) * s * 0.03, s, t, clamp((2.8 - fx) / 0.5) * clamp((fx + 2.4) / 0.4 + 0.2));
    }
    // a golden key floats down, turning slowly; the dolly carries us right past it
    const kz = 5, kd = kz - cz;
    if (kd > 0.22) {
      const ky = lerp(-2.4, 0.45, E.outQ(seg(t, 0.4, 2.2))) + Math.sin(t * 1.7) * 0.06, p = P(0.55, ky, kz), s = SR_F / kd * 0.6;
      srShape(c, st.key, p[0], p[1], s, { sx: Math.cos(t * 1.3), rot: 0.3 + Math.sin(t * 0.9) * 0.2 });
    }
    // light from the doorway into the dark room
    if (open > 0) {
      const dc = P(0, 0.4, Z1), rr = SR_F / (Z1 - cz) * 4;
      const gl = c.createRadialGradient(dc[0], dc[1], 0, dc[0], dc[1], rr);
      gl.addColorStop(0, `rgba(200,220,255,${0.25 * open})`); gl.addColorStop(1, 'rgba(200,220,255,0)');
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = gl; c.fillRect(0, 0, 1920, 1080); c.restore();
    }
  }

  function srClock(c, x, y, R, droop, t) {
    const W2 = (px, py) => {
      const k = py / R;
      if (py > 0) return [x + px * (1 - 0.4 * droop * k), y + py * (1 + 0.25 * droop + 1.6 * droop * k * k)];
      return [x + px * (1 + 0.08 * droop), y + py * (1 - 0.55 * droop)];
    };
    const ring = (rr, n = 72) => { c.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * TAU, p = W2(Math.cos(a) * rr, Math.sin(a) * rr); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.closePath(); };
    ring(R); c.fillStyle = '#ded8c4'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#a07a2e'; c.stroke();
    ring(R * 0.86); c.lineWidth = 1.5; c.strokeStyle = 'rgba(90,70,40,0.5)'; c.stroke();
    c.strokeStyle = '#3a2e22'; c.lineWidth = 2.2;
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, p0 = W2(Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72), p1 = W2(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
    // hands run backward in stop-motion jumps, and bend with the face
    const step = Math.floor(t * 6) / 6, hands = [[-step * 0.9 - 1.2, 0.5, 4], [-step * 0.075 + 0.6, 0.78, 2.6]];
    hands.forEach(([a, l, lw]) => {
      c.beginPath(); for (let i = 0; i <= 6; i++) { const r2 = i / 6 * l * R, p = W2(Math.sin(a) * r2, -Math.cos(a) * r2); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      c.lineWidth = lw; c.lineCap = 'round'; c.strokeStyle = '#1e1813'; c.stroke();
    });
    // a drip gathering at the lowest point
    const lo = W2(0, R), dl = 34 * droop;
    c.fillStyle = '#ded8c4'; c.beginPath(); c.moveTo(lo[0] - 10, lo[1] - 4); c.quadraticCurveTo(lo[0], lo[1] + dl * 1.6, lo[0] + 10, lo[1] - 4); c.fill();
    c.strokeStyle = '#a07a2e'; c.lineWidth = 3; c.stroke();
  }

  function srMan(c, x, y, s) {   // Golconda: a man in a dark coat and bowler hat, s = height in px
    c.save(); c.translate(x, y); c.scale(s / 130, s / 130);
    c.fillStyle = '#17191e';
    c.beginPath(); c.moveTo(-17, -58); c.lineTo(17, -58); c.lineTo(23, 12); c.lineTo(-23, 12); c.closePath(); c.fill();
    c.fillRect(-14, 10, 11, 36); c.fillRect(3, 10, 11, 36);
    c.beginPath(); c.ellipse(-9, 47, 9, 4, 0, 0, TAU); c.ellipse(9, 47, 9, 4, 0, 0, TAU); c.fill();
    c.fillStyle = '#e8e3d8'; c.beginPath(); c.moveTo(-6, -58); c.lineTo(6, -58); c.lineTo(0, -44); c.closePath(); c.fill();
    c.fillStyle = '#5a1a1a'; c.fillRect(-1.5, -56, 3, 14);
    c.fillStyle = '#d6b49a'; c.beginPath(); c.ellipse(0, -70, 10, 13, 0, 0, TAU); c.fill();
    c.fillStyle = '#0c0c0e'; c.beginPath(); c.ellipse(0, -80, 17, 4, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(0, -82, 11, PI, 0); c.fill();
    c.restore();
  }

  function srEye(t, dy) {
    const o = E.ioS(seg(t, SR_T.eye[0], SR_T.eye[1])) * (1 - 0.94 * Math.exp(-Math.pow((t - SR_T.blink) / 0.07, 2)));
    const look = 1 - E.ioS(seg(t, 6.25, 6.7));
    return { x: 960, y: 300 + dy, o, px: (60 * vnoise(t * 0.7, 2) + 10) * look, py: 20 * vnoise(t * 0.6, 5) * look };
  }
  function srEyeDraw(c, e, t, st) {
    if (e.o <= 0.002) return;
    const RX = 330, RY = 150 * e.o;
    c.save(); c.translate(e.x, e.y);
    // a soft skin halo, so the eye reads as part of a face that is not there
    c.save(); c.scale(1, 0.5); const hg = c.createRadialGradient(0, 0, 100, 0, 0, 470);
    hg.addColorStop(0, `rgba(226,196,172,${0.75 * Math.min(1, e.o * 3)})`); hg.addColorStop(1, 'rgba(226,196,172,0)');
    c.fillStyle = hg; c.fillRect(-500, -500, 1000, 1000); c.restore();
    const up = [[-RX, 0], [-RX * 0.45, -RY * 1.3], [RX * 0.45, -RY * 1.3], [RX, 0]], dn = [[RX, 0], [RX * 0.45, RY * 1.05], [-RX * 0.45, RY * 1.05], [-RX, 0]];
    const alm = () => { c.beginPath(); c.moveTo(-RX, 0); c.bezierCurveTo(up[1][0], up[1][1], up[2][0], up[2][1], RX, 0); c.bezierCurveTo(dn[1][0], dn[1][1], dn[2][0], dn[2][1], -RX, 0); c.closePath(); };
    alm(); const sg = c.createRadialGradient(0, 0, 40, 0, 0, RX); sg.addColorStop(0, '#f7f3ec'); sg.addColorStop(1, '#cdbfb6'); c.fillStyle = sg; c.fill();
    c.save(); alm(); c.clip();
    // the iris is the sky itself (after Magritte, The False Mirror)
    const ix = e.px, iy = e.py, IR = 118;
    c.save(); c.beginPath(); c.arc(ix, iy, IR, 0, TAU); c.clip();
    const ig = c.createLinearGradient(0, iy - IR, 0, iy + IR); ig.addColorStop(0, SR.skyD); ig.addColorStop(0.6, SR.sky); ig.addColorStop(1, '#a9c8e6');
    c.fillStyle = ig; c.fillRect(ix - IR, iy - IR, IR * 2, IR * 2);
    c.drawImage(st.clouds[3], ix - 150 + ((t * 14) % 60), iy - 20, 200, 84);
    c.drawImage(st.clouds[1], ix - 40 - ((t * 9) % 40), iy - 100, 170, 72);
    c.restore();
    c.lineWidth = 12; c.strokeStyle = 'rgba(16,30,60,0.55)'; c.beginPath(); c.arc(ix, iy, IR - 5, 0, TAU); c.stroke();
    c.fillStyle = '#050608'; c.beginPath(); c.arc(ix, iy, 44, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(ix + 36, iy - 38, 14, 9, -0.5, 0, TAU); c.fill();
    const lid = c.createLinearGradient(0, -RY * 1.1, 0, -RY * 0.2); lid.addColorStop(0, 'rgba(60,30,20,0.45)'); lid.addColorStop(1, 'rgba(60,30,20,0)');
    c.fillStyle = lid; c.fillRect(-RX, -RY * 1.2, RX * 2, RY);
    c.restore();
    c.lineCap = 'round'; c.strokeStyle = '#2a1c18';
    c.lineWidth = 5; c.beginPath(); c.moveTo(-RX, 0); c.bezierCurveTo(up[1][0], up[1][1], up[2][0], up[2][1], RX, 0); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(RX, 0); c.bezierCurveTo(dn[1][0], dn[1][1], dn[2][0], dn[2][1], -RX, 0); c.stroke();
    c.globalAlpha = 0.35; c.beginPath(); c.moveTo(-RX * 0.8, -RY * 0.7 - 30 * e.o); c.quadraticCurveTo(0, -RY * 1.25 - 46 * e.o, RX * 0.8, -RY * 0.7 - 30 * e.o); c.stroke(); c.globalAlpha = 1;
    c.lineWidth = 3;
    for (let k = 1; k < 20; k++) {
      const u = k / 20, p = bz(up[0], up[1], up[2], up[3], u), l = 30 * Math.sin(u * PI) * (0.4 + 0.6 * e.o);
      c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + (u - 0.5) * 30, p[1] - l * 0.7, p[0] + (u - 0.5) * 46, p[1] - l); c.stroke();
    }
    c.restore();
  }

  // The plain: Magritte's sky over Dalí's ochre ground, everything hung from the moving horizon.
  function srPlain(c, t, st) {
    const hz = srHz(t), dy = hz - 715;
    const sk = c.createLinearGradient(0, hz - 1500, 0, hz);
    sk.addColorStop(0, '#102c5e'); sk.addColorStop(0.5, SR.sky); sk.addColorStop(0.88, SR.skyHi); sk.addColorStop(1, SR.haze);
    c.fillStyle = sk; c.fillRect(-300, -300, 2520, hz + 300);
    st.cl.forEach(([i, x0, y0, v, s]) => {
      const img = st.clouds[i], w = img.width * s, x = ((x0 + t * v) % 2600 + 2600) % 2600 - 400;
      c.drawImage(img, x, y0 + dy * 0.85, w, img.height * s);
    });
    const e = srEye(t, dy); srEyeDraw(c, e, t, st);
    // Golconda: men in bowler hats appear and rise like slow balloons
    st.men.forEach(m => {
      const a = seg(t, SR_T.men + m.d, SR_T.men + m.d + 0.6); if (a <= 0) return;
      c.globalAlpha = a; srMan(c, m.x + Math.sin(t * 0.5 + m.ph) * 6, m.y + dy * 0.9 - (t - SR_T.men) * 16 * m.s, 40 + 70 * m.s); c.globalAlpha = 1;
    });
    // ground
    if (hz < 1180) {
      const gr = c.createLinearGradient(0, hz, 0, hz + 380); gr.addColorStop(0, SR.sandH); gr.addColorStop(0.3, SR.sand); gr.addColorStop(1, SR.sandD);
      c.fillStyle = gr; c.fillRect(-300, hz, 2520, 1600);
      c.fillStyle = '#7d98ad'; c.beginPath(); c.moveTo(-300, hz - 7); c.lineTo(820, hz - 7); c.lineTo(980, hz); c.lineTo(-300, hz); c.closePath(); c.fill();
      // the cliffs of Cap de Creus on the horizon
      poly(c, [[1180, hz], [1240, hz - 30], [1330, hz - 58], [1420, hz - 48], [1500, hz - 92], [1590, hz - 84], [1690, hz - 36], [1820, hz - 24], [2200, hz - 12], [2200, hz]]);
      c.fillStyle = SR.rock; c.fill();
      c.fillStyle = 'rgba(255,220,160,0.35)'; c.fillRect(1180, hz - 2, 1100, 2);
      for (let k = 0; k < 26; k++) {
        const u = k / 26, y = hz + 10 + u * u * 360, x = hash(k * 3.1) * 2000 - 40, w = 60 + 340 * u;
        c.fillStyle = `rgba(110,70,35,${0.08 + 0.08 * hash(k)})`; c.beginPath(); c.ellipse(x, y, w, 1.5 + 4 * u, 0, 0, TAU); c.fill();
      }
      const sh = (pts, a = 0.28) => { poly(c, pts); c.fillStyle = `rgba(70,40,20,${a})`; c.fill(); };
      // a door standing alone, open onto night
      const dx = 440, db = hz + 215, dw = 150, dh = 330, da = 1.1 + Math.sin(t * 0.6) * 0.08;
      sh([[dx - dw / 2 - 14, db], [dx + dw / 2 + 26, db], [dx + dw / 2 - 540, db + 46], [dx - dw / 2 - 600, db + 46]]);
      c.fillStyle = SR.doorS; c.fillRect(dx + dw / 2 + 14, db - dh - 14, 12, dh + 14);
      c.fillStyle = SR.door; c.fillRect(dx - dw / 2 - 14, db - dh - 14, dw + 28, dh + 14);
      const ng = c.createLinearGradient(0, db - dh, 0, db); ng.addColorStop(0, '#040812'); ng.addColorStop(1, '#16284a');
      c.fillStyle = ng; c.fillRect(dx - dw / 2, db - dh, dw, dh);
      c.fillStyle = '#fff'; for (let k = 0; k < 14; k++) c.fillRect(dx - dw / 2 + hash(k * 7.7) * dw, db - dh + hash(k * 3.3) * dh * 0.8, 2, 2);
      c.fillStyle = '#f3ecd2'; c.beginPath(); c.arc(dx - 30, db - dh + 70, 18, 0, TAU); c.fill();
      c.fillStyle = '#0a1224'; c.beginPath(); c.arc(dx - 22, db - dh + 64, 16, 0, TAU); c.fill();
      const hx = dx + dw / 2, fx = hx - dw * Math.cos(da), lift = 22 * Math.sin(da);
      const leaf = [[hx, db - dh], [fx, db - dh - lift], [fx, db + lift], [hx, db]];
      poly(c, leaf); c.fillStyle = '#ece6d8'; c.fill(); c.strokeStyle = 'rgba(80,70,55,0.5)'; c.lineWidth = 2; c.stroke();
      [[0.15, 0.85, 0.07, 0.45], [0.15, 0.85, 0.55, 0.93]].forEach(([u0, u1, v0, v1]) => { poly(c, [bil(leaf, u0, v0), bil(leaf, u1, v0), bil(leaf, u1, v1), bil(leaf, u0, v1)]); c.stroke(); });
      // a stone plinth where the key now lies
      const px0 = 770, px1 = 990, pt = hz + 238;
      sh([[px0, pt + 110], [px1, pt + 110], [px1 - 520, pt + 150], [px0 - 560, pt + 150]], 0.25);
      c.fillStyle = SR.stoneD; c.fillRect(px1, pt - 12, 22, 122);
      poly(c, [[px0, pt], [px1, pt], [px1 + 22, pt - 12], [px0 + 22, pt - 12]]); c.fillStyle = '#efe5cf'; c.fill();
      c.fillStyle = SR.stone; c.fillRect(px0, pt, px1 - px0, 110);
      // the key becomes a bird, in stepped stop-motion jumps; the bird flies off into the sky it is made of
      const mt = seg(t, SR_T.morph[0], SR_T.morph[1]), step = Math.floor(mt * 9) / 9, mu = E.ioS(step);
      if (t < SR_T.fly[0]) {
        const pts = st.key.map((p, i) => { const q = st.bird[i], j = mt > 0 && mt < 1 ? (hash(step * 31 + i) - 0.5) * 0.02 : 0; return [lerp(p[0], q[0], mu) + j, lerp(p[1], q[1], mu) + j]; });
        const lift2 = mu * 40;
        c.fillStyle = 'rgba(70,40,20,0.3)'; c.beginPath(); c.ellipse(882, pt - 6, 70 * (1 - mu * 0.4), 6, 0, 0, TAU); c.fill();
        srShape(c, pts, 880, pt - 14 - lift2, 150, { sky: clamp(mu * 1.6 - 0.3), st, t, rot: -0.05 });
      } else {
        const fu = seg(t, SR_T.fly[0], SR_T.fly[1]), p = bz([880, pt - 54], [760, hz - 160], [400, 260 + dy], [-200, 120 + dy], E.inQ(fu * 0.8 + fu * fu * 0.2));
        const fl2 = 0.3 + 0.7 * Math.abs(Math.cos((t - SR_T.fly[0]) * 6)), pts = st.bird.map(q => (q[1] < -0.08 ? [q[0], -0.08 + (q[1] + 0.08) * fl2] : q));
        srShape(c, pts, p[0], p[1], 150 + 120 * fu, { sky: 1, st, t, rot: -0.15 + Math.sin(t * 3) * 0.05 });
      }
      // dead tree with a melting clock over its branch
      const tb = hz + 300;
      sh([[1590, tb], [1620, tb], [1060, tb + 40], [1040, tb + 40]], 0.22);
      tube(c, [[1605, tb], [1592, tb - 120], [1570, tb - 240], [1560, tb - 330]], 22, 12); c.fillStyle = SR.bark; c.fill();
      const br = [[1566, tb - 300], [1500, tb - 316], [1420, tb - 326], [1330, tb - 322], [1260, tb - 300]];
      tube(c, br, 11, 4); c.fill();
      tube(c, [[1562, tb - 326], [1590, tb - 400], [1640, tb - 450]], 8, 2); c.fill();
      tube(c, [[1460, tb - 320], [1440, tb - 370]], 5, 1.5); c.fill();
      srClock(c, 1360, tb - 322, 74, E.ioS(seg(t, 3.3, 6.8)) * 0.9 + 0.1, t);
    }
    return e;
  }

  // The Empire of Light: a night street under a noon sky.
  function srEmpire(c, t, st) {
    const u = Math.max(0, t - SR_T.dive[0]), zs = 1 + 0.05 * u / 3.3;
    c.save(); c.translate(1000, 620); c.scale(zs, zs); c.translate(-1000, -620);
    const sk = c.createLinearGradient(0, 0, 0, 640); sk.addColorStop(0, '#3a6fbd'); sk.addColorStop(0.6, '#8fb5dd'); sk.addColorStop(1, '#dbe6ee');
    c.fillStyle = sk; c.fillRect(-200, -200, 2320, 900);
    [[2, 120, 60, 0.9], [0, 900, 120, 0.8], [4, 1450, 40, 0.7], [3, 520, 250, 0.6]].forEach(([i, x, y, s]) => { const img = st.clouds[i]; c.drawImage(img, x + u * 8, y, img.width * s, img.height * s); });
    // a man in a bowler hat floats up from behind the trees
    const mu = seg(t, 8.0, 10); if (mu > 0) { c.save(); c.translate(560, lerp(470, 300, mu)); c.rotate(Math.sin(t * 0.8) * 0.12); srMan(c, 0, 0, 70); c.restore(); }
    c.fillStyle = '#070a0e'; c.beginPath(); st.crowns.forEach(([x, y, r]) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); c.rect(x - r * 0.8, y, r * 1.6, 720 - y); }); c.fill();
    c.fillRect(-200, 700, 2320, 600);
    // house: dark facade, mansard roof, three lit windows
    poly(c, [[990, 548], [1230, 432], [1470, 548]]); c.fillStyle = '#16181f'; c.fill(); c.strokeStyle = 'rgba(150,170,200,0.25)'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#0d0e13';
    c.fillRect(1360, 440, 34, 70);
    c.fillStyle = '#101218'; c.fillRect(1010, 545, 440, 345);
    [[1090, 600], [1300, 600], [1300, 745]].forEach(([x, y], i) => {
      const fl = 0.92 + 0.08 * vnoise(t * 3 + i * 7, i);
      const wg = c.createLinearGradient(x, y, x, y + 100); wg.addColorStop(0, `rgba(255,214,140,${fl})`); wg.addColorStop(1, `rgba(230,150,70,${fl})`);
      c.fillStyle = wg; c.fillRect(x, y, 70, 100);
      c.fillStyle = '#101218'; c.fillRect(x + 33, y, 4, 100); c.fillRect(x, y + 46, 70, 4);
      c.fillStyle = '#0b0d0c'; c.fillRect(x - 26, y - 4, 22, 108); c.fillRect(x + 74, y - 4, 22, 108);
    });
    c.fillStyle = '#07080b'; c.fillRect(1180, 745, 80, 145);
    // street lamp and its pool of light
    c.fillStyle = '#050608'; c.fillRect(846, 560, 8, 340); c.fillRect(832, 892, 36, 10);
    poly(c, [[834, 522], [866, 522], [872, 556], [828, 556]]); c.fill();
    c.fillStyle = '#ffe6a8'; c.fillRect(838, 530, 24, 22);
    c.save(); c.globalCompositeOperation = 'lighter';
    [[850, 541, 170, 0.5], [850, 541, 420, 0.16], [1230, 680, 380, 0.08]].forEach(([x, y, r, a]) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,200,120,${a})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    });
    // pond: rippling reflections of the lamp and windows
    for (let y = 905; y < 1100; y += 6) {
      const k = (y - 905) / 190, w = Math.sin(y * 0.21 + t * 2.2) * (6 + k * 14);
      c.fillStyle = `rgba(255,205,130,${0.5 * (1 - k)})`; c.fillRect(840 + w, y, 20 + k * 20, 2.5);
      c.fillStyle = `rgba(255,190,110,${0.3 * (1 - k)})`; c.fillRect(1300 + w * 0.8, y, 70, 2); if (y < 1010) c.fillRect(1090 + w * 0.8, y, 70, 2);
    }
    c.restore();
    c.fillStyle = 'rgba(10,20,40,0.35)'; c.fillRect(-200, 900, 2320, 4);
    c.restore();
  }

  MG.film({
    id: 'surreal', dur: 10, poster: 9.3,
    fonts: [['italic 400 120px "Playfair Display"', 'Surreal Cinema'], ['italic 500 40px "Cormorant Garamond"', 'Once upon a time… Around three in the morning Sixteen years before Švankmajer Buñuel Dalí']],
    meta: {
      family: 'H', name: 'Surreal Cinema', sub: 'Dream logic on film', era: '1928 —',
      origin: 'Surrealist film cuts the way a dream does: rooms open onto impossible places, objects turn into other objects and the intertitles lie about time. Luis Buñuel and Salvador Dalí’s Un Chien Andalou (1929) set the grammar, Maya Deren’s Meshes of the Afternoon (1943) looped a dreamer through her own house, Jan Švankmajer animated objects into uncanny life, and David Lynch carried the mode into curtained rooms with zigzag floors.',
      works: 'Un Chien Andalou (Luis Buñuel & Salvador Dalí, 1929) · L’Âge d’Or (Buñuel, 1930) · Meshes of the Afternoon (Maya Deren & Alexander Hammid, 1943) · Spellbound, dream sequence designed by Dalí (Alfred Hitchcock, 1945) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Alice (Švankmajer, 1988) · Twin Peaks (David Lynch & Mark Frost, 1990) · Mulholland Drive (Lynch, 2001)',
      tech: ['Door-as-portal dolly', 'Stop-motion object morph', 'Zoom through a pupil'],
      accent: '#c8323c',
      motionDNA: 'A slow camera that never stops: an even dolly that is suddenly pulled through a door, a tilt from cloud down to sand, a fall into an eye. Things move with dream patience — a key floating, men rising like balloons, a clock sagging — and one object turns into another in stepped stop-motion jumps.',
      visualDNA: 'Red pleated curtains over a black-and-white zigzag floor, a hooded figure with a mirror for a face, Magritte’s blue sky and sculpted clouds (an eye whose iris is sky, bowler-hatted men, a bird cut from sky, a night street under a noon sky), Dalí’s ochre plain, cliffs and melting clock, soft grain and lying intertitles.',
      transitions: 'Door as portal, tilt reveal, match on object (key becomes bird), a blink, zoom into the pupil as it turns into a keyhole',
      implementation: ['35mm camera, built sets and in-camera tricks', 'Stop-motion animation', 'Canvas 2D'],
      reproducibility: 'Fully procedural homage',
      loopable: false,
    },
    setup() {
      const r = rng(1929), st = {};
      st.curtain = srCurtainTex();
      st.clouds = [srCloudSprite(11, 560, 230), srCloudSprite(23, 420, 180), srCloudSprite(37, 680, 260), srCloudSprite(41, 360, 150), srCloudSprite(53, 500, 210)];
      st.cl = [[0, 80, 330, 10, 1], [2, 1250, 260, 7, 0.9], [4, 700, 480, 12, 0.8], [1, 1700, 470, 9, 0.7], [3, 300, 120, 6, 0.9], [2, 2100, 90, 8, 0.7]];
      st.men = Array.from({ length: 16 }, () => ({ x: 60 + r() * 1800, y: 80 + r() * 520, s: 0.3 + r() * 0.7, ph: r() * TAU, d: r() * 0.9 })).sort((a, b) => a.s - b.s);
      st.key = srResample(srOrient(srKeyRaw()), 72);
      st.bird = srResample(srOrient(SR_BIRD), 72);
      // tree line: small lumpy crowns along a ridge, tall at the sides and low behind the house
      st.crowns = [];
      for (let x = -80; x < 2020; x += 16) {
        const ridge = x < 820 ? 330 + 60 * Math.sin(x * 0.009) : x < 1480 ? 470 + 20 * Math.sin(x * 0.02) : 280 + 50 * Math.sin(x * 0.011 + 1);
        const rr = 26 + r() * 34; st.crowns.push([x + r() * 10, ridge + rr * 0.6 + (r() - 0.5) * 40, rr]);
      }
      return st;
    },
    draw(c, t, W, H, st) {
      // the whole dream drifts: a slow roll and breathing scale
      c.save(); c.translate(960, 540); c.rotate(0.012 * Math.sin(t * 0.45)); c.scale(1.03, 1.03); c.translate(-960, -540);
      if (SR_Z1 - srCamZ(t) > 0.38 && t < SR_T.push[1]) srCorridor(c, t, st);
      else if (t < SR_T.dive[1]) {
        const dv = seg(t, SR_T.dive[0], SR_T.dive[1]), Z = Math.exp(Math.log(70) * E.inC(dv)), m = E.ioS(seg(t, 6.9, 7.4));
        const e0 = srEye(t, srHz(t) - 715), pcx = e0.x + e0.px, pcy = e0.y + e0.py;
        c.save(); c.translate(pcx, pcy); c.scale(Z, Z); c.translate(-pcx, -pcy);
        srPlain(c, t, st);
        c.restore();
        if (m > 0) {
          // the pupil becomes a keyhole, and through it the next room
          const pr = 44 * Z, cr = pr * lerp(1, 0.8, m), cy = pcy - pr * 0.35 * m;
          c.save(); c.beginPath(); c.arc(pcx, cy, cr, 0, TAU);
          c.moveTo(pcx - pr * 0.3, cy + cr * 0.6); c.lineTo(pcx + pr * 0.3, cy + cr * 0.6); c.lineTo(pcx + pr * 0.62, cy + cr * 0.6 + pr * 1.7 * m); c.lineTo(pcx - pr * 0.62, cy + cr * 0.6 + pr * 1.7 * m); c.closePath();
          c.clip('nonzero');
          srEmpire(c, t, st);
          c.fillStyle = `rgba(5,6,8,${1 - m})`; c.fillRect(-100, -100, 2120, 1280);
          c.restore();
        }
      } else srEmpire(c, t, st);
      c.restore();
      // projector breathing: a faint exposure drift (never a flash)
      c.fillStyle = `rgba(0,0,0,${0.04 + 0.03 * vnoise(t * 6, 9)})`; c.fillRect(0, 0, W, H);
      // intertitles that lie about time (Un Chien Andalou)
      SR_CAP.forEach(([a, b, s]) => {
        const u = seg(t, a, a + 0.35) * (1 - seg(t, b - 0.35, b)); if (u <= 0) return;
        c.save(); c.globalAlpha = u; c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 18;
        text(c, s, 960, 1010, { font: '"Cormorant Garamond", serif', style: 'italic', weight: 500, size: 46, align: 'center', color: SR.cream, ls: 1 });
        c.restore();
      });
      if (t > SR_T.title) {
        const u = E.outC(seg(t, SR_T.title, SR_T.title + 1.2)), u2 = E.outC(seg(t, SR_T.title + 0.5, SR_T.title + 1.5));
        const bg = c.createLinearGradient(0, 760, 0, 1080); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, `rgba(0,0,0,${0.65 * u})`);
        c.fillStyle = bg; c.fillRect(0, 760, W, 320);
        c.save(); c.globalAlpha = u; c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 24;
        text(c, 'Surreal Cinema', 960, 925 - 12 * (1 - u), { font: '"Playfair Display", serif', style: 'italic', size: 124, align: 'center', color: SR.cream, ls: lerp(0, 4, seg(t, SR_T.title, 10)) });
        c.globalAlpha = u2;
        text(c, 'dream logic · after Buñuel & Dalí, Deren, Švankmajer and Lynch', 960, 990, { font: '"Cormorant Garamond", serif', style: 'italic', weight: 500, size: 38, align: 'center', color: 'rgba(243,234,216,0.85)' });
        c.restore();
      }
      grain(c, W, H, t, 0.08, 'overlay');
      vignette(c, W, H, 0.6);
    },
    score(A) {
      A.bus.gain.value = 0.85;
      // drone bed: a low fifth, filter slowly opening
      A.osc(0, { type: 'sawtooth', f: midi(33), dur: 10, g: 0.045, a: 2, hold: true, rel: 1.2, lp: 180, lp2: 520, lpT: 7, q: 3, rev: 0.3 });
      A.osc(0, { f: midi(40), dur: 10, g: 0.05, a: 2.5, hold: true, rel: 1.2, detune: 6, rev: 0.4 });
      // a theremin line: sine with wide vibrato gliding between notes
      [[0.5, 69, 72, 1.6], [2.2, 75, 70, 1.2], [3.6, 68, 71, 1.5], [5.3, 76, 73, 1.3], [6.8, 64, 76, 0.95]].forEach(([t, a, b, d]) => A.osc(t, { f: midi(a), f2: midi(b), glide: d * 0.7, dur: d, g: 0.055, a: 0.35, hold: true, rel: 0.35, vib: [5.2, 7], rev: 0.65 }));
      // music box in a whole-tone scale, a tune half remembered
      [84, 86, 88, 90, 88, 84, 82, 86].forEach((m, i) => A.bell(0.3 + i * 0.36, midi(m), { g: 0.035, dur: 1.4, rev: 0.6, pan: i % 2 ? 0.3 : -0.3 }));
      // the door: a creak, then daylight wind from the other side
      A.noise(SR_T.door[0], { type: 'bandpass', f: 380, f2: 900, sweep: 0.8, q: 9, dur: 0.9, g: 0.1, rev: 0.4 });
      A.osc(SR_T.door[0], { type: 'square', f: 70, f2: 110, glide: 0.8, dur: 0.85, g: 0.012, lp: 600 });
      A.noise(1.9, { type: 'bandpass', f: 600, f2: 1800, q: 0.6, dur: 3.0, g: 0.07, swell: 0.5, rev: 0.5 });
      A.whoosh(2.75, 0.6, { f1: 300, f2: 2500, g: 0.12 });
      // the melting clock ticks backward in jumps
      for (let k = 0; k < 10; k++) A.noise(3.4 + k / 3, { type: 'bandpass', f: k % 2 ? 2400 : 3200, q: 6, dur: 0.03, g: 0.07, pan: 0.4, rev: 0.2 });
      // stop-motion clicks as the key becomes a bird, then wing beats
      for (let k = 0; k < 9; k++) A.noise(SR_T.morph[0] + k / 9 * 1.1, { type: 'bandpass', f: 1600, q: 3, dur: 0.018, g: 0.06, pan: -0.1 });
      for (let k = 0; k < 10; k++) A.noise(SR_T.fly[0] + k * 0.16, { type: 'lowpass', f: 900, dur: 0.09, g: 0.06 * (1 - k / 12), pan: -0.3 - k * 0.04 });
      // the eye opens: a low, unresolved chord
      A.chord(SR_T.eye[0], [45, 52, 56, 60], { type: 'triangle', dur: 2.2, g: 0.03, a: 1.0, hold: true, rel: 0.8, lp: 1400, width: 0.8, rev: 0.6 });
      // the men rise: soft plucks stepping upward
      [64, 66, 68, 70, 72].forEach((m, i) => A.pluck(SR_T.men + 0.15 + i * 0.25, midi(m), { g: 0.12, bright: 0.35, dur: 1.2, rev: 0.4, pan: (i - 2) * 0.2 }));
      // the fall into the pupil, and the night street under a noon sky
      A.riser(SR_T.dive[0], 1.05, { g: 0.1, f: 80 });
      A.impact(SR_T.dive[1], 0.3);
      A.chord(SR_T.dive[1], [50, 57, 62, 66, 69], { dur: 2.25, g: 0.035, a: 0.3, hold: true, rel: 0.8, width: 1, rev: 0.7 });
      A.bell(SR_T.title, midi(74), { g: 0.05, dur: 1.6, rev: 0.7 });
      A.bell(SR_T.title + 0.5, midi(81), { g: 0.035, dur: 1.2, rev: 0.7 });
    },
  });

  /* =====================================================================
     FOUND FOOTAGE — an overscanned 16mm strip runs through the gate with
     its perforations, frame lines and edge print in view. Academy leader
     counts down, a premature THE END (after Conner's A Movie), then a chain
     of unrelated stock shots — newsreel, tinted silent reel, home movie,
     dupe — is spliced into a new story by typed captions: a man looks up,
     a rocket rises, a bridge dances, a crowd cheers. Every shot holds a
     clock and every clock agrees (after Marclay's The Clock); the cutting
     speeds up toward noon, and at 12:00 the title is printed over the last shot.
     ===================================================================== */
  const FF_IW = 1122, FF_IH = 820, FF_FL = 36, FF_PITCH = FF_IH + FF_FL, FF_X0 = 960 - FF_IW / 2, FF_Y0 = 130, FF_M = 92;
  const FF_SX0 = FF_X0 - FF_M, FF_SX1 = FF_X0 + FF_IW + FF_M;
  const FF_GW = 640, FF_GH = 468;           // every shot is drawn at 16mm scan resolution, then projected up
  // stocks: filter, perforations (1 = single, 2 = double), optical soundtrack, corner radius, frame rate, flicker, edge print
  const FF_ST = {
    leader: { f: 'grayscale(1) contrast(1.05)', perf: 1, snd: 0, r: 8, fps: 24, fl: 0.03, edge: 'HEAD  ·  PICTURE START  ·  16', ec: 'rgba(230,225,210,0.5)' },
    bw: { f: 'grayscale(1) contrast(1.4)', perf: 1, snd: 1, r: 14, fps: 24, fl: 0.06, edge: 'SAFETY FILM  ▲  4 1  ●  2 0 7', ec: 'rgba(235,230,215,0.45)' },
    dupe: { f: 'grayscale(1) contrast(1.8) brightness(0.92) blur(1.2px)', perf: 1, snd: 1, r: 12, fps: 24, fl: 0.08, edge: 'DUPE PRINT  ·  2ND GENERATION', ec: 'rgba(235,230,215,0.4)' },
    amber: { f: 'grayscale(1) sepia(1) saturate(2.6) hue-rotate(-8deg) contrast(1.1)', perf: 1, snd: 0, r: 18, fps: 18, fl: 0.07, edge: 'TINTED PRINT  ·  SILENT  ·  18', ec: 'rgba(240,190,110,0.5)' },
    blue: { f: 'grayscale(1) sepia(1) hue-rotate(175deg) saturate(1.7) contrast(1.15)', perf: 1, snd: 1, r: 14, fps: 24, fl: 0.05, edge: 'SAFETY FILM  ●  1 9 5 7', ec: 'rgba(180,210,240,0.45)' },
    koda: { f: 'saturate(1.45) contrast(1.1)', perf: 2, snd: 0, r: 30, fps: 18, fl: 0.05, edge: 'COLOR REVERSAL  ·  PROCESSED AUG 58', ec: 'rgba(250,210,120,0.55)' },
  };
  // [start, scene, stock]: unrelated sources, cut faster and faster toward noon
  const FF_SHOTS = [
    [0.00, 'leader', 'leader'], [1.25, 'end', 'bw'], [1.70, 'tower', 'bw'], [2.50, 'watcher', 'amber'], [3.30, 'rocket', 'blue'],
    [4.15, 'beach', 'koda'], [4.80, 'bridge', 'bw'], [5.60, 'crowd', 'amber'], [6.05, 'rope', 'dupe'], [6.50, 'kitchen', 'koda'],
    [7.05, 'watch', 'amber'], [7.32, 'tower', 'bw'], [7.52, 'kitchen', 'koda'], [7.70, 'watch', 'amber'], [7.84, 'station', 'bw'],
  ];
  const FF_CAP = [[2.6, 3.3, 'HE SAW IT FIRST.'], [3.4, 4.12, 'THEY TOLD US IT WAS WEATHER.'], [4.9, 5.58, 'THEN THE GROUND BEGAN TO DANCE.'], [6.1, 6.48, 'NOBODY LOOKED DOWN.'], [6.55, 7.3, 'AND EVERY CLOCK AGREED:'], [8.0, 8.4, 'NOON.']];
  const FF_TITLE = 8.4;

  // Every clock in the film reads the same time: 11:59:52 plus film time, so noon falls at t = 8.
  function ffClock(g, x, y, r, T, o = {}) {
    const S = 11 * 3600 + 59 * 60 + 52 + T, h = (S / 3600) % 12, m = o.jump ? Math.floor(S / 60) % 60 : (S / 60) % 60, s = o.sweep ? S % 60 : Math.floor(S % 60);
    g.fillStyle = o.face || '#ecebe5'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (o.rim) { g.lineWidth = o.rimW || r * 0.12; g.strokeStyle = o.rim; g.stroke(); }
    g.strokeStyle = o.ink || '#111'; g.lineCap = 'butt';
    for (let k = 0; k < (o.min ? 60 : 12); k++) {
      const a = k / (o.min ? 60 : 12) * TAU, big = !o.min || k % 5 === 0, r0 = r * (big ? 0.74 : 0.84);
      g.lineWidth = big ? r * 0.06 : r * 0.02; g.beginPath(); g.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0); g.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); g.stroke();
    }
    const hand = (a, l, w, col) => { g.strokeStyle = col || o.ink || '#111'; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - Math.sin(a) * l * 0.15, y + Math.cos(a) * l * 0.15); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke(); };
    hand(h / 12 * TAU, r * 0.5, r * 0.09); hand(m / 60 * TAU, r * 0.78, r * 0.06);
    if (!o.noSec) hand(s / 60 * TAU, r * 0.84, Math.max(1, r * 0.022), o.sec);
    g.fillStyle = o.ink || '#111'; g.beginPath(); g.arc(x, y, r * 0.06, 0, TAU); g.fill();
  }
  const ffSky = (g, a, b, h = FF_GH) => { const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, a); s.addColorStop(1, b); g.fillStyle = s; g.fillRect(-40, -40, FF_GW + 80, h + 80); };
  const ffPuff = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };

  const FF_SCENE = {
    leader(g, u) {
      if (u < 0.3) {
        g.fillStyle = '#e4e1d8'; g.fillRect(0, 0, FF_GW, FF_GH);
        g.strokeStyle = '#111'; g.lineWidth = 8; g.strokeRect(130, 140, 380, 188);
        text(g, 'PICTURE', 320, 224, { font: 'Oswald', weight: 700, size: 70, align: 'center', color: '#111', ls: 8 });
        text(g, 'START', 320, 306, { font: 'Oswald', weight: 700, size: 70, align: 'center', color: '#111', ls: 8 });
        return;
      }
      if (u >= 0.9) { g.fillStyle = '#080808'; g.fillRect(0, 0, FF_GW, FF_GH); return; }
      const n = u < 0.6 ? 3 : 2, fr = ((u - 0.3) % 0.3) / 0.3;
      g.fillStyle = '#a3a19b'; g.fillRect(0, 0, FF_GW, FF_GH);
      g.fillStyle = '#5f5d58'; g.beginPath(); g.moveTo(320, 234); g.arc(320, 234, 460, -PI / 2, -PI / 2 + fr * TAU); g.closePath(); g.fill();
      g.strokeStyle = '#121212'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 234); g.lineTo(640, 234); g.moveTo(320, 0); g.lineTo(320, 468); g.stroke();
      g.lineWidth = 6; [190, 166].forEach(r => { g.beginPath(); g.arc(320, 234, r, 0, TAU); g.stroke(); });
      g.fillStyle = '#efede6'; g.beginPath(); g.arc(320, 234, 160, 0, TAU); g.fill();
      text(g, String(n), 320, 236, { font: 'Oswald', weight: 500, size: 250, align: 'center', base: 'middle', color: '#0b0b0b' });
    },
    end(g, u) {
      g.fillStyle = '#060606'; g.fillRect(0, 0, FF_GW, FF_GH);
      g.strokeStyle = 'rgba(240,236,225,0.8)'; g.lineWidth = 2; g.strokeRect(150, 150, 340, 168); g.strokeRect(158, 158, 324, 152);
      text(g, 'THE END', 320, 252, { font: '"Playfair Display"', size: 78, align: 'center', color: '#f1ede2', ls: 10 });
    },
    tower(g, u, T) {
      ffSky(g, '#e6e6e0', '#a4a49e');
      [[90, 110, 50], [150, 95, 40], [520, 80, 60], [590, 120, 45]].forEach(([x, y, r]) => ffPuff(g, x + u * 12, y, r, 'rgba(255,255,255,0.35)'));
      g.save(); g.translate(-u * 14, 0);
      // smokestacks breathing smoke into the wind
      [[70, 210], [130, 240]].forEach(([x, y], i) => {
        g.fillStyle = '#4a4a46'; g.fillRect(x - 12, y, 24, 300);
        for (let k = 0; k < 10; k++) { const a = (u * 0.8 + k * 0.1 + i * 0.05) % 1; ffPuff(g, x + a * 190, y - a * 120, 10 + a * 42, `rgba(70,70,66,${0.5 * (1 - a)})`); }
      });
      g.fillStyle = '#707069'; for (let x = -20; x < 700; x += 70) g.fillRect(x, 330 - hash(x) * 80, 64, 200);
      g.fillStyle = '#34342f'; for (let x = -30; x < 700; x += 50) g.fillRect(x, 390 - hash(x + 9) * 50, 46, 120);
      g.fillStyle = '#c9c9c0'; for (let k = 0; k < 40; k++) g.fillRect(hash(k * 5.1) * 660, 360 + hash(k * 2.3) * 90, 5, 7);
      // the clock tower
      g.fillStyle = '#3e3e39'; g.fillRect(300, 150, 90, 330);
      g.fillStyle = '#4d4d47'; g.fillRect(285, 105, 120, 110);
      poly(g, [[290, 106], [345, 22], [400, 106]]); g.fillStyle = '#2f2f2b'; g.fill();
      ffClock(g, 345, 160, 40, T, { rim: '#22221f', noSec: false });
      g.restore();
      for (let k = 0; k < 7; k++) {
        const x = (k * 113 + u * 190) % 780 - 70, y = 70 + hash(k) * 90 + Math.sin(u * 4 + k) * 6, w = Math.sin(u * 22 + k) * 6;
        g.strokeStyle = '#222'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - 9, y - w); g.lineTo(x, y); g.lineTo(x + 9, y - w); g.stroke();
      }
    },
    watcher(g, u) {
      ffSky(g, '#f0efe9', '#b7b6ae');
      [[460, 120, 70], [560, 160, 50], [120, 90, 60]].forEach(([x, y, r]) => ffPuff(g, x - u * 30, y, r, 'rgba(255,255,255,0.5)'));
      g.save(); g.translate(0, 20); g.rotate(-0.04 - u * 0.05);
      g.fillStyle = '#272523'; g.beginPath(); g.moveTo(40, 520); g.quadraticCurveTo(80, 330, 250, 320); g.quadraticCurveTo(420, 330, 520, 520); g.fill();
      g.fillStyle = '#e8e4da'; poly(g, [[240, 322], [300, 322], [270, 380]]); g.fill();
      g.fillStyle = '#9a948a'; g.beginPath(); g.ellipse(290, 245, 66, 82, 0.15, 0, TAU); g.fill();
      g.fillStyle = '#7c776e'; g.beginPath(); g.ellipse(240, 252, 12, 20, 0, 0, TAU); g.fill();
      g.fillStyle = '#1c1b19'; g.fillRect(232, 140, 120, 52); g.beginPath(); g.ellipse(292, 192, 128, 18, -0.12, 0, TAU); g.fill();
      g.fillStyle = '#4b4842'; g.fillRect(232, 176, 120, 10);
      g.save(); g.translate(340, 236); g.rotate(-0.55);
      [[-24], [24]].forEach(([oy]) => { g.fillStyle = '#151413'; g.fillRect(0, oy - 20, 130, 40); g.fillStyle = '#5c5a55'; g.fillRect(126, oy - 22, 12, 44); });
      g.fillStyle = '#8f897f'; g.beginPath(); g.ellipse(70, 34, 32, 18, 0, 0, TAU); g.fill();
      g.restore(); g.restore();
    },
    rocket(g, u) {
      const rise = E.inQ(clamp(u / 0.85)) * 300;
      ffSky(g, '#6f777c', '#b9bec0');
      g.save(); g.translate(0, rise * 0.55);
      g.fillStyle = '#6d6f6e'; poly(g, [[0, 400], [120, 360], [260, 390], [420, 350], [640, 385], [640, 500], [0, 500]]); g.fill();
      g.fillStyle = '#2a2b2b'; g.fillRect(0, 410, 640, 300);
      g.strokeStyle = '#1e1f1f'; g.lineWidth = 3;
      for (let y = 110; y < 410; y += 30) { g.beginPath(); g.moveTo(200, y); g.lineTo(250, y + 30); g.moveTo(250, y); g.lineTo(200, y + 30); g.stroke(); }
      g.strokeRect(200, 110, 50, 300);
      const by = 400 - rise;
      for (let k = 0; k < 34; k++) {
        const a = clamp(u * 1.5 - hash(k) * 0.4), d = hash(k * 3.7) < 0.5 ? -1 : 1; if (a <= 0) continue;
        const px = 330 + d * a * 280 * hash(k * 1.9), py = 405 - a * 50 * hash(k * 5.3), pr = 14 + a * 72; ffPuff(g, px, py + pr * 0.12, pr, '#8d8f8e'); ffPuff(g, px - pr * 0.08, py - pr * 0.06, pr * 0.9, k % 3 ? '#ecece8' : '#cfd0cd');
      }
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(314, by); g.quadraticCurveTo(330, by + 90 + Math.sin(u * 60) * 12, 346, by); g.fill();
      g.fillStyle = '#f2f2ee'; g.fillRect(313, by - 170, 34, 170); g.strokeStyle = '#111'; g.lineWidth = 2; g.strokeRect(313, by - 170, 34, 170);
      g.fillStyle = '#151515'; for (let k = 0; k < 4; k++) g.fillRect(313 + (k % 2) * 17, by - 170 + k * 42, 17, 42);
      poly(g, [[313, by - 170], [330, by - 232], [347, by - 170]]); g.fillStyle = '#e9e9e4'; g.fill();
      g.fillStyle = '#151515'; poly(g, [[313, by - 40], [290, by], [313, by]]); g.fill(); poly(g, [[347, by - 40], [370, by], [347, by]]); g.fill();
      g.restore();
    },
    beach(g, u) {
      g.save(); g.translate(Math.sin(u * 7) * 5, Math.cos(u * 9) * 4);
      ffSky(g, '#5aa6e0', '#cdeaf8', 230);
      const sun = g.createRadialGradient(560, 40, 0, 560, 40, 200); sun.addColorStop(0, 'rgba(255,250,220,0.9)'); sun.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = sun; g.fillRect(300, -100, 400, 340);
      g.fillStyle = '#1f72ae'; g.fillRect(-20, 210, 700, 100);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2;
      for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) { const x = (k * 90 + r * 37 + u * 30 * (r + 1)) % 760 - 60, y = 222 + r * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r * 6, y); g.stroke(); }
      const sw = 300 + Math.sin(u * 2.4) * 8;
      g.fillStyle = '#efd59b'; g.fillRect(-20, sw, 700, 300);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(-20, sw); for (let x = -20; x <= 680; x += 20) g.lineTo(x, sw + 5 + Math.sin(x * 0.05 + u * 3) * 4); g.lineTo(680, sw); g.fill();
      // striped umbrella, towel and a child waving at the camera
      g.fillStyle = '#7a5a3a'; g.fillRect(498, 230, 5, 190);
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#f4f0e6' : '#d8342c'; g.beginPath(); g.moveTo(500, 222); g.arc(500, 236, 110, PI + k / 8 * PI, PI + (k + 1) / 8 * PI); g.closePath(); g.fill(); }
      for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#f2e05a' : '#2f8fd0'; g.fillRect(380 + k * 22, 420, 22, 40); }
      const kx = 230, ky = 420, wave = -2.3 + Math.sin(u * 10) * 0.45;
      g.strokeStyle = '#f0b48a'; g.lineCap = 'round'; g.lineWidth = 12;
      g.beginPath(); g.moveTo(kx - 10, ky - 4); g.lineTo(kx - 14, ky + 44); g.moveTo(kx + 10, ky - 4); g.lineTo(kx + 14, ky + 44); g.stroke();
      g.beginPath(); g.moveTo(kx + 16, ky - 58); g.lineTo(kx + 16 + Math.cos(wave) * 50, ky - 58 + Math.sin(wave) * 50); g.moveTo(kx - 16, ky - 58); g.lineTo(kx - 30, ky - 14); g.stroke();
      g.fillStyle = '#d9302a'; rrect(g, kx - 22, ky - 70, 44, 70, 12); g.fill();
      g.fillStyle = '#f0b48a'; g.beginPath(); g.arc(kx, ky - 92, 24, 0, TAU); g.fill();
      g.fillStyle = '#7a4a22'; g.beginPath(); g.arc(kx, ky - 98, 24, PI * 1.05, PI * 1.95); g.fill();
      g.restore();
    },
    bridge(g, u) {
      ffSky(g, '#bdbdb7', '#8f8f89');
      g.fillStyle = '#62625d'; poly(g, [[0, 330], [160, 300], [320, 320], [480, 296], [640, 316], [640, 400], [0, 400]]); g.fill();
      g.fillStyle = '#2a2a28'; g.fillRect(0, 390, 640, 100);
      g.strokeStyle = 'rgba(200,200,195,0.35)'; g.lineWidth = 1.5; for (let k = 0; k < 24; k++) { const x = hash(k) * 640 + Math.sin(u * 2 + k) * 6, y = 400 + hash(k * 3) * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 24, y); g.stroke(); }
      const XL = 150, XR = 490, cab = x => (x < XL ? lerp(170, 64, (x + 20) / (XL + 20)) : x > XR ? lerp(64, 170, (x - XR) / (680 - XR)) : 64 + 150 * Math.sin(PI * (x - XL) / (XR - XL)));
      // torsional mode with a node at midspan: the two halves of the deck twist against each other
      const th = x => { const s = (x - XL) / (XR - XL); return s < 0 || s > 1 ? 0 : 0.85 * Math.sin(TAU * s) * Math.sin(u * 5.2); };
      const dy = x => { const s = (x - XL) / (XR - XL); return s < 0 || s > 1 ? 0 : 7 * Math.sin(PI * s) * Math.sin(u * 2.6); };
      g.strokeStyle = '#1b1b1a'; g.lineWidth = 1.2;
      for (let x = -10; x < 660; x += 12) { g.beginPath(); g.moveTo(x, cab(x)); g.lineTo(x, 260 + dy(x)); g.stroke(); }
      g.lineWidth = 3.5; g.beginPath(); for (let x = -20; x <= 680; x += 6) x === -20 ? g.moveTo(x, cab(x)) : g.lineTo(x, cab(x)); g.stroke();
      for (let x = -20; x < 680; x += 6) {
        const a = th(x), y0 = 262 + dy(x), n = y0 + 13 * Math.sin(a), f = y0 - 13 * Math.sin(a);
        g.fillStyle = Math.sin(a) >= 0 ? '#a3a39d' : '#3b3b38'; g.fillRect(x, Math.min(n, f) - 2, 6.5, Math.abs(n - f) + 4);
        g.fillStyle = '#1e1e1c'; g.fillRect(x, Math.max(n, f), 6.5, 6);
      }
      [XL, XR].forEach(x => { g.fillStyle = '#242422'; g.fillRect(x - 16, 54, 9, 350); g.fillRect(x + 7, 54, 9, 350); for (let y = 80; y < 380; y += 70) g.fillRect(x - 16, y, 32, 7); });
    },
    crowd(g, u) {
      g.fillStyle = '#8e8a82'; g.fillRect(0, 0, FF_GW, FF_GH);
      g.fillStyle = '#6c6962'; for (let x = 20; x < 640; x += 80) for (let y = 30; y < 260; y += 70) g.fillRect(x, y, 40, 46);
      g.strokeStyle = '#2a2826'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 40); g.quadraticCurveTo(320, 110, 640, 40); g.stroke();
      for (let k = 0; k < 16; k++) { const x = k * 40 + 10, y = 40 + 70 * (1 - Math.pow((x - 320) / 320, 2)) * 0.95; g.fillStyle = k % 2 ? '#e8e4da' : '#3a3835'; poly(g, [[x, y], [x + 26, y + 2], [x + 13, y + 30]]); g.fill(); }
      [[250, 18, 15], [330, 24, 13], [430, 34, 11]].forEach(([yb, r, n], row) => {
        for (let k = 0; k < n; k++) {
          const x = (k + 0.5 + (row % 2) * 0.4) / n * 680 - 20, b = Math.abs(Math.sin(u * 7 + k * 1.3 + row)) * 6, y = yb - b, cheer = hash(k * 7 + row) < 0.4;
          g.fillStyle = '#2e2c29'; rrect(g, x - r * 1.2, y + r * 0.6, r * 2.4, r * 4, r * 0.6); g.fill();
          g.fillStyle = '#b3ada2'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
          g.fillStyle = '#1c1b19'; g.beginPath(); g.ellipse(x, y - r * 0.6, r * 1.3, r * 0.25, 0, 0, TAU); g.fill(); g.fillRect(x - r * 0.75, y - r * 1.25, r * 1.5, r * 0.7);
          if (cheer) { const a = -2 + Math.sin(u * 12 + k) * 0.4, hx = x + r + Math.cos(a) * r * 2.6, hy = y + r * 0.8 + Math.sin(a) * r * 2.6; g.strokeStyle = '#2e2c29'; g.lineWidth = r * 0.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + r, y + r * 0.9); g.lineTo(hx, hy); g.stroke(); g.fillStyle = '#121110'; g.beginPath(); g.ellipse(hx, hy - r * 0.3, r, r * 0.4, a + PI / 2, 0, TAU); g.fill(); }
        }
      });
      g.fillStyle = '#f2efe6';
      for (let k = 0; k < 60; k++) { const x = hash(k) * 640 + Math.sin(u * 3 + k) * 12, y = (hash(k * 3) * 520 + u * 150) % 520 - 30; g.save(); g.translate(x, y); g.rotate(u * 4 + k); g.fillRect(-5, -1.5, 10, 3); g.restore(); }
    },
    rope(g, u) {
      ffSky(g, '#d8d8d2', '#f3f3ef');
      [[100, 340, 70], [520, 300, 90], [300, 380, 60]].forEach(([x, y, r]) => ffPuff(g, x + u * 20, y, r, 'rgba(255,255,255,0.7)'));
      for (let k = 0; k < 30; k++) { const x = k * 23, h = 10 + hash(k) * 30; g.fillStyle = '#7a7a74'; g.fillRect(x, 468 - h, 20, h); }
      const wx = 320 + u * 30, sag = 14, wy = x => lerp(220, 250, x / 640) + sag * Math.exp(-Math.pow((x - wx) / 120, 2));
      g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 640; x += 10) x ? g.lineTo(x, wy(x)) : g.moveTo(x, wy(x)); g.stroke();
      const a = Math.sin(u * 2.3) * 0.14;
      g.save(); g.translate(wx, wy(wx)); g.rotate(-a * 0.5);
      g.fillStyle = '#121212'; g.fillRect(-5, -60, 4, 60); g.fillRect(2, -60, 4, 60); rrect(g, -10, -110, 20, 54, 6); g.fill();
      g.beginPath(); g.arc(0, -122, 11, 0, TAU); g.fill();
      g.rotate(a * 1.5); g.fillRect(-150, -88, 300, 3.5);
      g.restore();
    },
    kitchen(g, u, T) {
      g.fillStyle = '#a6dcc8'; g.fillRect(0, 0, FF_GW, FF_GH);
      for (let x = 0; x < 640; x += 32) for (let y = 260; y < 468; y += 32) { g.fillStyle = ((x + y) / 32) % 2 ? '#f4f1e6' : '#f2cf5b'; g.fillRect(x, y, 32, 32); }
      g.fillStyle = '#bfe6f7'; g.fillRect(40, 50, 150, 170); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(40, 50, 150, 170); g.beginPath(); g.moveTo(115, 50); g.lineTo(115, 220); g.stroke();
      for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#fff' : '#e04c43'; g.fillRect(28 + k * 9, 40, 9, 190); g.fillRect(156 + k * 9, 40, 9, 190); }
      ffClock(g, 450, 140, 62, T, { rim: '#d8443a', face: '#fbf6e8', rimW: 10 });
      g.fillStyle = '#efc84a'; g.fillRect(0, 384, 640, 90); g.fillStyle = '#c9ccce'; g.fillRect(0, 380, 640, 8);
      g.fillStyle = '#d7dadc'; rrect(g, 540, 300, 50, 84, 12); g.fill(); g.fillStyle = '#9aa0a4'; g.fillRect(536, 296, 58, 10);
      const turn = E.ioS(seg(u, 0.05, 0.35));
      g.fillStyle = '#e98aa0'; poly(g, [[200, 220], [300, 220], [330, 400], [170, 400]]); g.fill();
      g.fillStyle = '#fbf8f0'; poly(g, [[215, 260], [285, 260], [300, 390], [200, 390]]); g.fill();
      g.fillStyle = '#f0bf96'; g.beginPath(); g.arc(250, 180, 32, 0, TAU); g.fill();
      g.fillStyle = '#6a3d22'; g.beginPath(); g.arc(250 - turn * 8, 170, 34, PI * 0.95, PI * 2.05); g.fill(); g.fillRect(214 - turn * 8, 170, 16, 30);
      g.fillStyle = '#2a1a12'; g.beginPath(); g.arc(256 + turn * 14, 182, 3, 0, TAU); g.arc(238 + turn * 18, 182, 3, 0, TAU); g.fill();
    },
    watch(g, u, T) {
      const bg = g.createRadialGradient(320, 220, 40, 320, 240, 420); bg.addColorStop(0, '#8b8072'); bg.addColorStop(1, '#4a443d'); g.fillStyle = bg; g.fillRect(0, 0, FF_GW, FF_GH);
      g.fillStyle = '#c9a88a'; g.beginPath(); g.ellipse(360, 470, 320, 150, -0.1, 0, TAU); g.fill();
      for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(80 + k * 10, 330 + k * 40, 70, 24, -0.3, 0, TAU); g.fill(); }
      g.strokeStyle = '#d9b96a'; g.lineWidth = 6; g.setLineDash([10, 5]); g.beginPath(); g.moveTo(320, 52); g.bezierCurveTo(470, 20, 620, 120, 660, 300); g.stroke(); g.setLineDash([]);
      g.lineWidth = 10; g.strokeStyle = '#c9a24a'; g.beginPath(); g.arc(320, 50, 20, 0, TAU); g.stroke();
      const cg = g.createLinearGradient(170, 70, 470, 370); cg.addColorStop(0, '#f2d78a'); cg.addColorStop(1, '#7c5e22'); g.fillStyle = cg; g.beginPath(); g.arc(320, 220, 156, 0, TAU); g.fill();
      ffClock(g, 320, 220, 130, T, { face: '#f1ece0', min: true, noSec: true });
      ffClock(g, 320, 290, 28, T, { face: '#e6e0d0', min: false, noSec: false });
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 8; g.beginPath(); g.arc(320, 220, 112, PI * 1.1, PI * 1.45); g.stroke();
    },
    station(g, u, T) {
      g.fillStyle = '#8c8b85'; g.fillRect(0, 0, FF_GW, FF_GH);
      for (let k = 0; k < 3; k++) { const x = 40 + k * 220; g.fillStyle = '#c8c7c0'; g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 140); g.arc(x + 90, 140, 90, PI, 0); g.lineTo(x + 180, 300); g.fill(); g.strokeStyle = '#55544f'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + i * 45, 50); g.lineTo(x + i * 45, 300); g.stroke(); } }
      for (let k = 0; k < 8; k++) { const a = (u * 0.15 + k / 8) % 1; ffPuff(g, 80 + k * 70 + a * 40, 300 - a * 160, 30 + a * 50, `rgba(235,235,230,${0.35 * (1 - a)})`); }
      g.fillStyle = '#3d3c38'; g.fillRect(0, 380, 640, 100);
      for (let k = 0; k < 9; k++) { const x = ((k * 83 + u * (k % 2 ? 40 : -30)) % 720 + 720) % 720 - 40, s = 0.8 + hash(k) * 0.4; g.fillStyle = '#1e1d1b'; g.beginPath(); g.arc(x, 360 - 50 * s, 9 * s, 0, TAU); g.fill(); rrect(g, x - 11 * s, 360 - 40 * s, 22 * s, 60 * s, 6 * s); g.fill(); }
      g.fillStyle = '#1c1b19'; g.fillRect(310, 0, 20, 60);
      g.beginPath(); g.arc(320, 225, 168, 0, TAU); g.fill();
      ffClock(g, 320, 225, 152, T, { face: '#f4f3ee', min: true, jump: true, sweep: true, sec: '#3a3a3a' });
    },
  };

  function ffRender(cv, sc, u, T, sx = 1) {
    const g = cv.getContext('2d');
    g.setTransform(sx, 0, 0, sx, 0, 0); g.save();
    FF_SCENE[sc](g, u, T);
    g.restore();
  }
  // one frame of strip: base, perforations on the frame line above it, soundtrack or edge print, then the picture
  function ffFrame(c, y, S, cv, t, f) {
    c.fillStyle = S === FF_ST.koda ? '#140e08' : '#0b0a09'; c.fillRect(FF_SX0, y - FF_FL, FF_SX1 - FF_SX0, FF_PITCH);
    const py = y - FF_FL / 2;
    c.fillStyle = '#d8d2c3'; rrect(c, FF_SX0 + 14, py - 22, 54, 44, 9); c.fill();
    if (S.perf === 2) { rrect(c, FF_SX1 - 68, py - 22, 54, 44, 9); c.fill(); }
    if (S.snd) {
      c.fillStyle = '#e9e4d6';
      for (let yy = y - FF_FL; yy < y + FF_IH; yy += 3) { const a = 0.15 + 0.85 * Math.abs(vnoise((yy + f * FF_PITCH) * 0.045, 3) * vnoise((yy + f * 97) * 0.008, 5)); c.fillRect(FF_SX1 - 60 + 20 - a * 18, yy, a * 36, 3); }
    }
    c.save(); c.translate(FF_X0 - 22, y + FF_IH / 2); c.rotate(-PI / 2);
    text(c, `${S.edge}   ${String(1000 + f).padStart(5, '0')}`, 0, 0, { font: '"Oswald"', weight: 500, size: 14, align: 'center', base: 'middle', color: S.ec, ls: 3 });
    c.restore();
    if (!S.snd && S.perf === 1) { c.save(); c.translate(FF_SX1 - 40, y + FF_IH / 2); c.rotate(PI / 2); text(c, '●  ●  ●', 0, 0, { font: '"Oswald"', size: 14, align: 'center', base: 'middle', color: S.ec }); c.restore(); }
    c.save(); rrect(c, FF_X0, y, FF_IW, FF_IH, S.r); c.clip();
    c.filter = `${S.f} brightness(${(1 + S.fl * (hash(f * 1.7) - 0.5) * 2).toFixed(3)})`;
    c.drawImage(cv, FF_X0, y, FF_IW, FF_IH);
    c.filter = 'none';
    if (S === FF_ST.koda) { c.fillStyle = 'rgba(255,170,80,0.07)'; c.fillRect(FF_X0, y, FF_IW, FF_IH); }
    const vg = c.createRadialGradient(960, y + FF_IH / 2, FF_IH * 0.35, 960, y + FF_IH / 2, FF_IW * 0.68); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = vg; c.fillRect(FF_X0, y, FF_IW, FF_IH);
    c.restore();
  }

  MG.film({
    id: 'foundfootage', dur: 10, poster: 9.4,
    fonts: [['700 130px Oswald', 'FOUND FOOTAGE PICTURE START 0123456789'], ['500 14px Oswald', 'SAFETY FILM'], ['400 46px "Special Elite"', 'HE SAW IT FIRST. NOON. a new film cut from old ones'], ['400 78px "Playfair Display"', 'THE END']],
    meta: {
      family: 'H', name: 'Found Footage', sub: 'Archival collage cinema', era: '1958 —',
      origin: 'Found-footage film makes new cinema out of other people’s film: newsreels, home movies, educational reels and leader are cut together until their juxtaposition says something none of them meant. Bruce Conner’s A Movie (1958) set the form with mismatched stock shots and a premature THE END; Craig Baldwin’s Tribulation 99 (1991) built a mock conspiracy history from stock footage, and Christian Marclay’s The Clock (2010) assembled a 24-hour film from clock shots synchronised to real time.',
      works: 'Rose Hobart (Joseph Cornell, 1936) · A Movie (Bruce Conner, 1958) · Report (Bruce Conner, 1967) · Tribulation 99: Alien Anomalies Under America (Craig Baldwin, 1991) · Decasia (Bill Morrison, 2002) · The Clock (Christian Marclay, 2010)',
      tech: ['Collage cutting across stocks', 'Overscan: perfs, edges, splices', 'Clocks synced to film time'],
      accent: '#e8b23a',
      motionDNA: 'Rhythm comes from the cut, not the camera: shots of 0.2–0.9 s from unrelated sources, eyeline and graphic matches that invent cause and effect, a cutting rate that accelerates toward noon, and the strip itself moving — gate weave, 18 fps home-movie judder against 24 fps newsreel, splice frames rolling the frame line through the gate.',
      visualDNA: 'An overscanned 16mm strip with perforations, frame lines, edge print and optical soundtrack in view; every shot a different stock — high-contrast newsreel, amber and blue tints, saturated home-movie colour, a soft dupe, grey academy leader; scratches, dust and hairs; typewritten captions that re-narrate the footage; trims hanging at the sides.',
      transitions: 'Hard cuts on tape splices with a frame-line roll, leader countdown, a false THE END, eyeline matches, clocks agreeing across cuts, title printed over the last shot',
      implementation: ['16mm flatbed / optical printer', 'Archive scans with overscan', 'Canvas 2D (every “archival” shot procedurally drawn)'],
      reproducibility: 'Fully procedural (no archival material used)',
      loopable: false,
    },
    setup() {
      const st = { cv: offscreen(FF_GW, FF_GH), cv2: offscreen(FF_GW, FF_GH), thumbs: [] };
      // trims hanging beside the gate: thumbnails of other reels, baked with their stock
      [['tower', 'bw', 1], ['beach', 'koda', 0.4], ['rocket', 'blue', 0.5], ['crowd', 'amber', 0.2], ['bridge', 'bw', 0.3], ['kitchen', 'koda', 0.2], ['rope', 'dupe', 0.3], ['watch', 'amber', 0.1]].forEach(([sc, sk, u]) => {
        const tmp = offscreen(320, 234); ffRender(tmp, sc, u, 1 + u, 0.5);
        const th = offscreen(320, 234), g = th.getContext('2d'); g.filter = FF_ST[sk].f; g.drawImage(tmp, 0, 0); g.filter = 'none';
        st.thumbs.push(th);
      });
      st.scr = FF_SHOTS.map((s, i) => { const r = rng(300 + i); return Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({ x: 0.08 + r() * 0.84, v: (r() - 0.5) * 0.03, w: 1 + r() * 2.5, dark: r() < 0.4 })); });
      return st;
    },
    draw(c, t, W, H, st) {
      const f24 = Math.floor(t * 24);
      const bg = c.createRadialGradient(960, 540, 200, 960, 540, 1100); bg.addColorStop(0, '#36322c'); bg.addColorStop(1, '#12110f');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // trims hanging at the sides, drifting slowly
      [[70, 1, 0], [1690, -1, 4]].forEach(([x, dir, o]) => {
        const off = ((t * 26 * dir) % 124 + 124) % 124;
        c.save(); c.globalAlpha = 0.55; c.translate(x + Math.sin(t * 0.7 + o) * 3, 0); c.rotate(dir * 0.012);
        c.fillStyle = '#0b0a09'; c.fillRect(0, -20, 180, 1120);
        for (let k = -1; k < 10; k++) {
          const y = k * 124 + off - 60, th = st.thumbs[(k + o + 16) % st.thumbs.length];
          c.drawImage(th, 30, y, 140, 102);
          c.fillStyle = '#b9b3a6'; rrect(c, 6, y + 108, 16, 12, 3); c.fill();
        }
        c.restore();
      });
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, W, H);
      // which shot, at its own stock's frame rate
      let i = FF_SHOTS.length - 1; while (FF_SHOTS[i][0] > t) i--;
      const [s0, sc, sk] = FF_SHOTS[i], S = FF_ST[sk];
      const fq = Math.floor((t - s0) * S.fps + 1e-6), u = fq / S.fps;
      ffRender(st.cv, sc, u, s0 + u);
      const sf = Math.floor((t - s0) * 24 + 1e-6);
      let roll = 0, PS = null;
      if (i > 0 && sf < 2) {
        // splice: the frame line rolls through the gate and the previous reel shows above the tape
        roll = [0.42, 0.14][sf] * FF_PITCH; const P = FF_SHOTS[i - 1]; PS = FF_ST[P[2]];
        const pu = Math.max(0, Math.floor((s0 - P[0]) * PS.fps) - 1) / PS.fps; ffRender(st.cv2, P[1], pu, P[0] + pu);
      }
      const wx = vnoise(t * 7, 1) * 2.5 + vnoise(t * 1.3, 4) * 2, wy = vnoise(t * 6, 2) * 3 + (S.fps === 18 ? (f24 % 4 === 0 ? 2 : 0) : 0);
      c.save(); c.translate(wx, wy + roll);
      for (let k = -1; k <= 1; k++) {
        const y = FF_Y0 + k * FF_PITCH; if (y > H + 40 || y + FF_IH < -40 - roll) continue;
        if (k < 0 && PS) ffFrame(c, y, PS, st.cv2, t, f24 - 1); else ffFrame(c, y, S, st.cv, t, f24 + k);
      }
      if (PS) {
        const ty = FF_Y0 - FF_FL - 6;
        c.fillStyle = 'rgba(200,220,235,0.22)'; c.fillRect(FF_SX0 - 6, ty, FF_SX1 - FF_SX0 + 12, 54);
        c.strokeStyle = 'rgba(230,240,250,0.5)'; c.lineWidth = 1.5; c.strokeRect(FF_SX0 - 6, ty, FF_SX1 - FF_SX0 + 12, 54);
        text(c, 'X', FF_X0 + 40, ty + 44, { font: '"Special Elite"', size: 40, color: 'rgba(255,255,255,0.75)' });
      }
      // damage on the current frame: scratches that wander with the reel, dust and hair that change every frame
      c.save(); rrect(c, FF_X0, FF_Y0, FF_IW, FF_IH, S.r); c.clip();
      st.scr[i].forEach(s => {
        const x = FF_X0 + (s.x + s.v * (t - s0) * 10 + vnoise(t * 3 + s.x * 10, 6) * 0.004) * FF_IW;
        c.fillStyle = s.dark ? `rgba(10,10,10,${0.35 + 0.3 * hash(f24)})` : `rgba(255,255,245,${0.3 + 0.4 * hash(f24 + 3)})`;
        c.fillRect(x, FF_Y0, s.w, FF_IH);
      });
      const r = rng(f24 * 7 + 3), nd = 6 + Math.floor(r() * 8);
      for (let k = 0; k < nd; k++) {
        const x = FF_X0 + r() * FF_IW, y = FF_Y0 + r() * FF_IH, s = 1.5 + r() * 5, wht = r() < 0.3;
        c.fillStyle = wht ? 'rgba(255,255,240,0.8)' : 'rgba(8,8,8,0.8)';
        if (r() < 0.2) { c.strokeStyle = c.fillStyle; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60, x + (r() - 0.5) * 50, y + (r() - 0.5) * 50); c.stroke(); }
        else { c.beginPath(); c.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * PI, 0, TAU); c.fill(); }
      }
      if (hash(Math.floor(t * 3)) > 0.6) { const hx = FF_X0 + 60 + hash(Math.floor(t * 3) + 1) * 300; c.strokeStyle = 'rgba(10,10,10,0.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, FF_Y0 + FF_IH); c.bezierCurveTo(hx + 30, FF_Y0 + FF_IH - 60, hx - 40, FF_Y0 + FF_IH - 90, hx + 10, FF_Y0 + FF_IH - 150); c.stroke(); }
      c.restore();
      // typed captions re-narrate the footage (Baldwin's mock history)
      FF_CAP.forEach(([a, b, s]) => {
        if (t < a || t >= b) return;
        const n = Math.min(s.length, Math.floor((t - a) * 60) + 1);
        text(c, s.slice(0, n), 960, FF_Y0 + FF_IH - 64, { font: '"Special Elite"', size: 50, align: 'center', color: '#f4eecf', stroke: 'rgba(0,0,0,0.85)', lw: 7, ls: 2 });
      });
      if (t >= FF_TITLE) {
        const a = E.outC(seg(t, FF_TITLE, FF_TITLE + 0.4)), b = E.outC(seg(t, FF_TITLE + 0.5, FF_TITLE + 1));
        c.fillStyle = `rgba(0,0,0,${0.55 * a})`; c.fillRect(FF_X0, FF_Y0, FF_IW, FF_IH);
        c.globalAlpha = a;
        text(c, 'FOUND FOOTAGE', 960, 600, { font: 'Oswald', weight: 700, size: 136, align: 'center', color: '#f6f2e6', ls: 10 });
        c.globalAlpha = b;
        text(c, 'a new film cut from old ones', 960, 668, { font: '"Special Elite"', size: 40, align: 'center', color: '#f2d38a' });
        text(c, 'AFTER BRUCE CONNER  ·  CRAIG BALDWIN  ·  CHRISTIAN MARCLAY', 960, 724, { font: 'Oswald', weight: 500, size: 24, align: 'center', color: 'rgba(246,242,230,0.8)', ls: 5 });
        c.globalAlpha = 1;
      }
      c.restore();
      grain(c, W, H, t, 0.1, 'overlay');
      vignette(c, W, H, 0.4);
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // the projector: motor whir and the claw pulling down frames
      A.noise(0, { type: 'bandpass', f: 420, q: 0.8, dur: 10, g: 0.035, hold: true, rel: 0.3 });
      for (let k = 0; k < 120; k++) A.noise(k / 12, { type: 'bandpass', f: 2600, q: 2, dur: 0.012, g: 0.03, pan: 0.15 });
      // leader: the 2-pop
      A.osc(0.6, { f: 1000, dur: 1 / 24, g: 0.12, hold: true, rel: 0.004 });
      // each fragment brings its own soundtrack, and is cut off with its picture
      A.chord(1.25, [55, 62, 67, 71], { type: 'sawtooth', dur: 0.42, g: 0.04, a: 0.01, lp: 1800, spread: 6, rev: 0.3, hold: true, rel: 0.02 });
      [[1.7, 67], [1.82, 72], [1.94, 76], [2.06, 79, 0.42]].forEach(([t, m, d]) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d || 0.11, g: 0.045, lp: 2200, vib: [6, 4], rev: 0.25, hold: true, rel: 0.02 }));
      for (let k = 0; k < 12; k++) A.snare(1.7 + k * 0.066, 0.05, { dur: 0.05, rev: 0.05 });
      A.chord(2.5, [50, 53, 56], { type: 'sawtooth', dur: 0.8, g: 0.03, lp: 900, vib: [9, 8], hold: true, rel: 0.02, rev: 0.3 });
      A.noise(3.3, { type: 'lowpass', f: 700, f2: 180, sweep: 0.85, dur: 0.85, g: 0.24, hold: true, rel: 0.03 });
      A.osc(3.3, { f: 55, f2: 40, dur: 0.85, g: 0.14, hold: true, rel: 0.03 });
      // the home movie is silent: only the projector
      A.chord(4.8, [41, 47, 52], { type: 'sawtooth', dur: 0.8, g: 0.035, lp: 700, hold: true, rel: 0.02 });
      A.osc(4.8, { type: 'square', f: 90, f2: 70, glide: 0.8, dur: 0.8, g: 0.014, lp: 500, vib: [1.3, 8] });
      A.noise(5.6, { type: 'bandpass', f: 1400, q: 0.5, dur: 0.45, g: 0.12, hold: true, rel: 0.02 });
      A.osc(6.05, { type: 'sawtooth', f: midi(88), dur: 0.45, g: 0.018, lp: 3000, vib: [6, 10], hold: true, rel: 0.02 });
      [79, 83, 86].forEach((m, i) => A.bell(6.5 + i * 0.1, midi(m), { g: 0.035, dur: 0.5, rev: 0.3 }));
      // the clocks: one tick per second of clock time, then a thump on every cut of the final montage
      [3, 4, 5, 6, 7].forEach(t => A.noise(t, { type: 'bandpass', f: 3200, q: 6, dur: 0.03, g: 0.1 }));
      [7.05, 7.32, 7.52, 7.70, 7.84].forEach((t, i) => { A.kick(t, 0.25 + i * 0.05, { f: 110, f2: 50 }); A.noise(t + 0.13, { type: 'bandpass', f: 3000 + i * 200, q: 6, dur: 0.03, g: 0.08 }); });
      A.riser(7.05, 0.95, { g: 0.08, f: 110 });
      // noon
      A.impact(8.0, 0.35);
      A.bell(8.0, midi(48), { g: 0.16, dur: 3.5, rev: 0.6 });
      A.bell(8.0, midi(55), { g: 0.08, dur: 3, rev: 0.6 });
      A.bell(9.0, midi(48), { g: 0.1, dur: 1.0, rev: 0.6 });
      A.chord(FF_TITLE, [48, 55, 60, 64, 67], { type: 'sawtooth', dur: 1.6, g: 0.028, a: 0.2, lp: 2000, lp2: 800, lpT: 1.6, spread: 7, width: 0.8, rev: 0.5 });
    },
  });

  /* =====================================================================
     SAAS PRODUCT MOTION — a launch film for a fictional issue tracker,
     "Driftline". A gradient mesh breathes behind a dark stage; an
     announcement pill and a headline spring up word by word; the app
     window rises in three-quarter perspective with satellite cards
     floating at other depths; it swings flat for a cursor-driven demo
     (click a row, ⌘K, type, Enter, the issue springs into Done, a toast);
     then it recedes while stat cards fly in and their numbers count up,
     and everything clears for the logo and a call to action.
     ===================================================================== */
  const SA = {
    bg: '#06060b', win: '#0d0e14', side: '#0a0b10', card: '#101119', line: 'rgba(255,255,255,0.08)', text: '#ededf2', mute: '#8a8c99', dim: '#5b5d6b',
    violet: '#8b7bff', blue: '#4f8cff', pink: '#e35bd6', teal: '#2fd4c4', green: '#3dd68c', amber: '#f5b54a', orange: '#ff8a4c',
  };
  const SA_T = { pill: 0.15, head: 0.4, sub: 1.0, rise: 1.45, sats: 1.9, flat: 3.15, cursor: 3.85, click: 4.35, kbd: 4.45, palette: 4.5, type: [4.65, 5.15], enter: 5.3, toast: 5.45, back: 6.1, stats: 6.35, outro: 8.05, logo: 8.3, cta: 8.75 };
  const SA_FNT = '"Geist", sans-serif', SA_MONO = '"Geist Mono", monospace', SA_F = 1700;
  const SA_ISSUE = {
    128: ['Polish onboarding checklist', 'Design', SA.pink, 'MK', 3, 'Mar 9'],
    131: ['Realtime sync for offline edits', 'Sync', SA.blue, 'JS', 2, 'Mar 11'],
    119: ['Keyboard-first triage view', 'UX', SA.violet, 'AL', 2, 'Mar 8'],
    140: ['Cut cold start under 300 ms', 'Perf', SA.amber, 'RT', 3, 'Mar 14'],
    142: ['SAML single sign-on for workspaces', 'Security', SA.teal, 'NO', 1, 'Mar 15'],
    137: ['Cycle burn-up chart in Insights', 'Insights', SA.green, 'MK', 2, 'Mar 12'],
    133: ['Webhook retries with backoff', 'API', SA.blue, 'JS', 1, 'Mar 16'],
    125: ['Dark mode for public roadmap', 'Design', SA.pink, 'AL', 1, 'Mar 5'],
    121: ['Bulk-edit labels', 'UX', SA.violet, 'RT', 2, 'Mar 6'],
  };
  const SA_GROUPS = [['In Progress', SA.amber], ['Todo', '#9a9caa'], ['Done', SA.violet]];
  const SA_AV = { MK: '#7c5cff', JS: '#2f9bd4', AL: '#d4569a', RT: '#e08a3a', NO: '#2fb59a' };
  const SA_OPTS0 = ['Assign to…', 'Change status…', 'Set priority…', 'Add label…', 'Move to cycle…'], SA_OPTS1 = ['Move to Done', 'Move to In Review', 'Move to cycle…'];
  const SA_TYPED = 'Move to Done';

  function saLayout(moved) {
    const gs = moved ? [[131, 119], [140, 142, 137, 133], [128, 125, 121]] : [[128, 131, 119], [140, 142, 137, 133], [125, 121]];
    let y = 212; const rows = {}, heads = [];
    gs.forEach((ids, gi) => { heads.push({ gi, y, n: ids.length }); y += 40; ids.forEach(id => { rows[id] = y; y += 50; }); });
    return { rows, heads };
  }
  const SA_L0 = saLayout(false), SA_L1 = saLayout(true);
  const saMv = t => clamp(spring(t - SA_T.enter - 0.25, 1.6, 0.75), 0, 1.08);

  // pose: screen-space centre (x, y), depth z (px, + is away), rotations rx (top tips back), ry, rz
  const saLerp = (A, B, u) => { const o = {}; for (const k in A) o[k] = lerp(A[k], B[k] ?? A[k], u); return o; };
  function saProj(p, w, h) {
    const cx = Math.cos(p.rx), sx = Math.sin(p.rx), cy = Math.cos(p.ry), sy = Math.sin(p.ry), cz = Math.cos(p.rz), sz = Math.sin(p.rz), s = p.s ?? 1;
    return (u, v) => {
      const X = (u - w / 2) * s, Y = (v - h / 2) * s;
      const X1 = X * cy, Z1 = X * sy, Y2 = Y * cx, Z2 = Z1 - Y * sx;
      const X3 = X1 * cz - Y2 * sz, Y3 = X1 * sz + Y2 * cz, k = SA_F / (SA_F + p.z + Z2);
      return [960 + (p.x - 960 + X3) * k, 540 + (p.y - 540 + Y3) * k];
    };
  }
  // Draw an offscreen card onto a perspective plane, as a grid of small affine cells.
  function saCard(c, img, w, h, p, a = 1) {
    if (a <= 0.004) return;
    const P = saProj(p, w, h), ps = img.width / w, q = [P(0, 0), P(w, 0), P(w, h), P(0, h)];
    c.save(); c.globalAlpha = a;
    // soft drop shadow, cast from a copy of the outline drawn off-canvas
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 70; c.shadowOffsetX = 10000; c.shadowOffsetY = 40;
    c.translate(-10000, 0); poly(c, q); c.fillStyle = '#000'; c.fill(); c.restore();
    const flat = Math.abs(p.rx) + Math.abs(p.ry) + Math.abs(p.rz) < 0.004;
    if (flat) c.drawImage(img, q[0][0], q[0][1], q[1][0] - q[0][0], q[3][1] - q[0][1]);
    else {
      const N = 24, M = 8, du = w / N, dv = h / M;
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
        const u0 = i * du, v0 = j * dv, o = P(u0, v0), ux = P(u0 + du, v0), vy = P(u0, v0 + dv);
        const sw = Math.min(du + 1.2, w - u0), sh = Math.min(dv + 1.2, h - v0);
        c.save(); c.transform((ux[0] - o[0]) / du, (ux[1] - o[1]) / du, (vy[0] - o[0]) / dv, (vy[1] - o[1]) / dv, o[0], o[1]);
        c.drawImage(img, u0 * ps, v0 * ps, sw * ps, sh * ps, 0, 0, sw, sh);
        c.restore();
      }
    }
    // a thin rim of light along the top edge
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.stroke();
    c.restore();
    return P;
  }
  // prepare a card canvas at pixel scale ps, cleared and clipped to a rounded panel
  function saPanel(cv, w, h, r = 16, fill = SA.card) {
    const g = cv.getContext('2d'), ps = cv.width / w;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(ps, 0, 0, ps, 0, 0);
    rrect(g, 0.5, 0.5, w - 1, h - 1, r); g.fillStyle = fill; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 1; g.stroke();
    return g;
  }
  const saT = (g, s, x, y, size, o = {}) => text(g, s, x, y, { font: o.mono ? SA_MONO : SA_FNT, weight: o.w || 400, size, color: o.c || SA.text, align: o.a, ls: o.ls, base: o.base });
  function saMark(g, x, y, s) {   // Driftline mark: rounded square, one drifting S-curve and a dot
    const gr = g.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); gr.addColorStop(0, SA.violet); gr.addColorStop(1, SA.blue);
    rrect(g, x - s / 2, y - s / 2, s, s, s * 0.28); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = s * 0.11; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - s * 0.26, y + s * 0.18); g.bezierCurveTo(x - s * 0.05, y + s * 0.18, x + s * 0.05, y - s * 0.18, x + s * 0.2, y - s * 0.18); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * 0.2, y + s * 0.14, s * 0.07, 0, TAU); g.fill();
  }
  function saStatus(g, x, y, kind, k = 1) {
    g.lineWidth = 1.8;
    if (kind === 'done') {
      g.fillStyle = SA.violet; g.beginPath(); g.arc(x, y, 8 * k, 0, TAU); g.fill();
      g.strokeStyle = '#0d0e14'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 3.5 * k, y); g.lineTo(x - 1 * k, y + 3 * k); g.lineTo(x + 4 * k, y - 3 * k); g.stroke();
    } else if (kind === 'prog') {
      g.strokeStyle = SA.amber; g.beginPath(); g.arc(x, y, 7.5, 0, TAU); g.stroke();
      g.fillStyle = SA.amber; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 4.5, -PI / 2, PI / 2); g.closePath(); g.fill();
    } else { g.strokeStyle = '#7d7f8c'; g.setLineDash([3, 2.6]); g.beginPath(); g.arc(x, y, 7.5, 0, TAU); g.stroke(); g.setLineDash([]); }
  }
  const saAvatar = (g, x, y, r, ini) => { g.fillStyle = SA_AV[ini] || SA.violet; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); saT(g, ini, x, y + r * 0.36, r * 0.9, { w: 600, a: 'center', c: '#fff' }); };

  function saWindow(cv, t) {
    const Wd = 1400, Hd = 860, g = saPanel(cv, Wd, Hd, 18, SA.win);
    g.save(); rrect(g, 0, 0, Wd, Hd, 18); g.clip();
    g.fillStyle = '#101119'; g.fillRect(0, 0, Wd, 44); g.fillStyle = SA.line; g.fillRect(0, 44, Wd, 1);
    [22, 42, 62].forEach(x => { g.fillStyle = '#34353f'; g.beginPath(); g.arc(x, 22, 6, 0, TAU); g.fill(); });
    saT(g, 'Acme Robotics  /  Core  /  Cycle 24', 700, 28, 14, { c: SA.mute, a: 'center' });
    rrect(g, 1180, 11, 200, 24, 7); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fill(); saT(g, 'Search', 1196, 28, 13, { c: SA.dim }); saT(g, '⌘K', 1366, 28, 12, { c: SA.dim, a: 'right', mono: 1 });
    // sidebar
    g.fillStyle = SA.side; g.fillRect(0, 45, 248, Hd); g.fillStyle = SA.line; g.fillRect(248, 45, 1, Hd);
    saMark(g, 34, 78, 24); saT(g, 'Acme Robotics', 56, 83, 15, { w: 600 });
    [['Inbox', '3'], ['My issues'], ['Cycles', null, 1], ['Projects'], ['Roadmap'], ['Insights']].forEach(([n, b, on], i) => {
      const y = 124 + i * 34;
      if (on) { rrect(g, 12, y - 20, 224, 30, 7); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill(); }
      rrect(g, 24, y - 12, 14, 14, 4); g.strokeStyle = on ? SA.text : SA.mute; g.lineWidth = 1.5; g.stroke();
      saT(g, n, 50, y, 14, { c: on ? SA.text : SA.mute, w: on ? 500 : 400 });
      if (b) { rrect(g, 204, y - 14, 22, 18, 9); g.fillStyle = SA.violet; g.fill(); saT(g, b, 215, y, 11, { a: 'center', w: 600, c: '#fff' }); }
    });
    saT(g, 'Teams', 24, 352, 12, { c: SA.dim, w: 500 });
    [['Core', SA.violet], ['Growth', SA.pink], ['Platform', SA.teal]].forEach(([n, col], i) => { const y = 384 + i * 32; rrect(g, 24, y - 11, 12, 12, 3); g.fillStyle = col; g.fill(); saT(g, n, 50, y, 14, { c: SA.mute }); });
    saAvatar(g, 36, Hd - 34, 12, 'MK'); saT(g, 'Mira Kade', 56, Hd - 29, 14, { c: SA.mute });
    // header and progress
    saT(g, 'Cycle 24', 276, 96, 26, { w: 600, ls: -0.5 }); saT(g, 'Mar 4 – Mar 17', 410, 96, 15, { c: SA.mute });
    ['RT', 'JS', 'AL', 'MK'].forEach((ini, i) => { g.strokeStyle = SA.win; g.lineWidth = 3; g.beginPath(); g.arc(1180 + i * 22, 88, 13, 0, TAU); g.stroke(); saAvatar(g, 1180 + i * 22, 88, 12, ini); });
    rrect(g, 1270, 72, 104, 32, 8); g.fillStyle = SA.violet; g.fill(); saT(g, 'New issue', 1322, 93, 14, { w: 600, a: 'center', c: '#fff' });
    const pct = lerp(82, 86, E.outC(seg(t, SA_T.enter + 0.15, SA_T.enter + 0.75)));
    rrect(g, 276, 120, 520, 6, 3); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
    const pg = g.createLinearGradient(276, 0, 796, 0); pg.addColorStop(0, SA.violet); pg.addColorStop(1, SA.blue);
    rrect(g, 276, 120, 520 * pct / 100, 6, 3); g.fillStyle = pg; g.fill();
    saT(g, `${Math.round(pct)}% complete · ${pct > 84 ? 15 : 14} of 21 issues`, 812, 128, 13, { c: SA.mute });
    [['All issues', 1], ['Active'], ['Backlog']].forEach(([n, on], i) => { const x = 276 + i * 110; saT(g, n, x, 172, 14, { c: on ? SA.text : SA.mute, w: on ? 500 : 400 }); if (on) { g.fillStyle = SA.text; g.fillRect(x, 182, 72, 2); } });
    g.fillStyle = SA.line; g.fillRect(249, 184, Wd, 1);
    // issue list, rows sliding between groups on a spring
    const mv = saMv(t), done128 = t > SA_T.enter + 0.05, sel = t > SA_T.click && t < SA_T.enter + 0.9;
    SA_L0.heads.forEach((h, k) => {
      const y = lerp(h.y, SA_L1.heads[k].y, mv), n = mv > 0.5 ? SA_L1.heads[k].n : h.n;
      g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(249, y, Wd, 40);
      saStatus(g, 292, y + 20, ['prog', 'todo', 'done'][k]);
      saT(g, SA_GROUPS[k][0], 310, y + 25, 14, { w: 600 }); saT(g, String(n), 310 + (k === 0 ? 92 : k === 1 ? 44 : 46), y + 25, 14, { c: SA.mute });
    });
    Object.keys(SA_ISSUE).forEach(k => {
      const id = +k, it = SA_ISSUE[id], y = lerp(SA_L0.rows[id], SA_L1.rows[id], mv);
      const st = id === 128 ? (done128 ? 'done' : 'prog') : SA_L0.rows[id] < SA_L0.heads[1].y ? 'prog' : SA_L0.rows[id] < SA_L0.heads[2].y ? 'todo' : 'done';
      if (id === 128 && sel) { g.fillStyle = 'rgba(139,123,255,0.13)'; g.fillRect(249, y, Wd, 50); g.fillStyle = SA.violet; g.fillRect(249, y, 2, 50); }
      if (id === 128 && done128) { const fl = Math.exp(-(t - SA_T.enter) * 3); g.fillStyle = `rgba(139,123,255,${0.2 * fl})`; g.fillRect(249, y, Wd, 50); }
      for (let b = 0; b < 3; b++) { g.fillStyle = b < it[4] ? '#a6a8b6' : '#3a3c48'; g.fillRect(272 + b * 5, y + 30 - b * 3 - 4, 3, 4 + b * 3); }
      saT(g, `DRF-${id}`, 300, y + 30, 13, { c: SA.dim, mono: 1 });
      saStatus(g, 378, y + 25, st, id === 128 && done128 ? clamp(spring(t - SA_T.enter, 2.4, 0.4), 0, 1.4) : 1);
      saT(g, it[0], 400, y + 30, 15, { c: st === 'done' && id !== 128 ? SA.mute : SA.text, w: 500 });
      g.font = `500 12px ${SA_FNT}`; const lw = g.measureText(it[1]).width + 28;
      rrect(g, 1180 - lw, y + 14, lw, 22, 11); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = it[2]; g.beginPath(); g.arc(1192 - lw, y + 25, 3.5, 0, TAU); g.fill(); saT(g, it[1], 1200 - lw, y + 29.5, 12, { c: SA.mute, w: 500 });
      saT(g, it[5], 1290, y + 30, 13, { c: SA.dim, a: 'right' });
      saAvatar(g, 1344, y + 25, 11, it[3]);
      g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(249, y + 49, Wd, 1);
    });
    // command menu
    const po = t < SA_T.enter ? clamp(spring(t - SA_T.palette, 2.4, 0.75), 0, 1.1) : 1 - E.inQ(seg(t, SA_T.enter, SA_T.enter + 0.18));
    if (t > SA_T.palette && po > 0.001) {
      g.fillStyle = `rgba(4,4,8,${0.5 * clamp(po)})`; g.fillRect(0, 0, Wd, Hd);
      g.save(); g.globalAlpha = clamp(po); g.translate(700, 360); const sc = lerp(0.94, 1, po); g.scale(sc, sc); g.translate(-310, -165);
      g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
      const n = Math.max(0, Math.min(SA_TYPED.length, Math.floor((t - SA_T.type[0]) / (SA_T.type[1] - SA_T.type[0]) * SA_TYPED.length + 1e-6)));
      const opts = n >= 4 ? SA_OPTS1 : SA_OPTS0, ph = 120 + opts.length * 42;
      rrect(g, 0, 0, 620, ph, 14); g.fillStyle = '#16171f'; g.fill(); g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
      rrect(g, 16, 14, 108, 24, 6); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill(); saT(g, 'DRF-128', 70, 31, 12, { c: SA.mute, mono: 1, a: 'center' });
      const typed = SA_TYPED.slice(0, n);
      saT(g, typed || 'Type a command or search…', 22, 74, 20, { c: typed ? SA.text : SA.dim });
      g.font = `400 20px ${SA_FNT}`; const cw = typed ? g.measureText(typed).width : 0;
      if (Math.floor(t * 2.5) % 2 === 0 || (t > SA_T.type[0] && t < SA_T.type[1])) { g.fillStyle = SA.violet; g.fillRect(24 + cw, 56, 2, 24); }
      g.fillStyle = SA.line; g.fillRect(0, 96, 620, 1);
      opts.forEach((o, i) => {
        const y = 108 + i * 42;
        if (i === 0) { rrect(g, 8, y, 604, 38, 8); g.fillStyle = 'rgba(139,123,255,0.16)'; g.fill(); g.fillStyle = SA.violet; g.fillRect(8, y + 8, 2, 22); }
        saStatus(g, 34, y + 19, o.includes('Done') ? 'done' : o.includes('Review') ? 'prog' : 'todo');
        // highlight the typed letters inside the option
        saT(g, o, 56, y + 25, 16, { c: i === 0 ? SA.text : SA.mute, w: i === 0 ? 500 : 400 });
        const key = ['D', 'R', 'C', 'L', 'M'][i]; rrect(g, 578, y + 9, 22, 20, 5); g.strokeStyle = 'rgba(255,255,255,0.15)'; g.stroke(); saT(g, key, 589, y + 24, 12, { c: SA.mute, a: 'center', mono: 1 });
      });
      g.restore();
    }
    // toast
    const ta = t > SA_T.toast ? clamp(spring(t - SA_T.toast, 2, 0.6), 0, 1.1) * (1 - seg(t, 6.0, 6.2)) : 0;
    if (ta > 0.001) {
      g.save(); g.globalAlpha = clamp(ta); g.translate(1020, Hd - 96 + (1 - ta) * 50);
      rrect(g, 0, 0, 360, 64, 12); g.fillStyle = '#1a1b24'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
      saStatus(g, 30, 32, 'done', 1.1); saT(g, 'DRF-128 moved to Done', 52, 30, 15, { w: 500 }); saT(g, 'Cycle 24 · 86% complete', 52, 50, 12, { c: SA.mute });
      saT(g, 'Undo', 340, 37, 13, { c: SA.violet, a: 'right', w: 500 });
      g.restore();
    }
    g.restore();
  }
  function saSats(st, t) {
    let g = saPanel(st.cyc, 360, 200);
    saT(g, 'Cycle 24', 24, 40, 17, { w: 600 }); saT(g, '3 days left', 24, 62, 13, { c: SA.mute });
    const p = 0.82 * E.outC(seg(t, SA_T.sats + 0.1, SA_T.sats + 1.1));
    g.lineWidth = 12; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.arc(270, 110, 52, 0, TAU); g.stroke();
    g.strokeStyle = SA.violet; g.beginPath(); g.arc(270, 110, 52, -PI / 2, -PI / 2 + TAU * p); g.stroke();
    saT(g, `${Math.round(p * 100)}%`, 270, 118, 22, { w: 600, a: 'center' });
    saT(g, '14 / 21', 24, 150, 30, { w: 600, ls: -1 }); saT(g, 'issues done', 24, 176, 13, { c: SA.mute });
    g = saPanel(st.dep, 420, 92);
    const pu = 0.5 + 0.5 * Math.sin(t * 5);
    g.fillStyle = rgba(SA.green, 0.25 * pu); g.beginPath(); g.arc(34, 46, 14, 0, TAU); g.fill(); g.fillStyle = SA.green; g.beginPath(); g.arc(34, 46, 6, 0, TAU); g.fill();
    saT(g, 'Deployed to production', 62, 40, 16, { w: 600 }); saT(g, 'main · 2a9f3c1 · 38s', 62, 64, 13, { c: SA.mute, mono: 1 });
    g = saPanel(st.ppl, 340, 120);
    ['MK', 'JS', 'AL', 'RT', 'NO'].forEach((ini, i) => { g.strokeStyle = SA.card; g.lineWidth = 4; g.beginPath(); g.arc(40 + i * 30, 46, 18, 0, TAU); g.stroke(); saAvatar(g, 40 + i * 30, 46, 17, ini); });
    saT(g, '12 teammates online', 24, 96, 14, { c: SA.mute });
  }
  function saStats(st, t) {
    const cu = k => E.outQt(seg(t, SA_T.stats + 0.35 + k * 0.15, SA_T.stats + 1.55 + k * 0.15));
    let g = saPanel(st.chart, 820, 430, 18);
    saT(g, 'Throughput', 32, 50, 22, { w: 600 }); saT(g, 'issues closed per week', 32, 76, 15, { c: SA.mute });
    const X0 = 60, X1 = 780, Y0 = 380, Y1 = 120, vals = [120, 138, 131, 162, 170, 158, 196, 214, 230, 251, 284, 312];
    g.fillStyle = 'rgba(255,255,255,0.05)'; [0, 1, 2, 3].forEach(k => g.fillRect(X0, Y0 - k * 80, X1 - X0, 1));
    const px = i => lerp(X0, X1, i / 11), py = v => lerp(Y0, Y1, v / 330), dr = cu(0) * 11;
    g.beginPath(); g.moveTo(px(0), Y0);
    for (let i = 0; i <= Math.floor(dr); i++) g.lineTo(px(i), py(vals[i]));
    const iE = Math.min(11, Math.floor(dr) + 1), fr = dr - Math.floor(dr), ex = lerp(px(Math.floor(dr)), px(iE), fr), ey = lerp(py(vals[Math.floor(dr)]), py(vals[iE]), fr);
    g.lineTo(ex, ey); g.lineTo(ex, Y0); g.closePath();
    const ag = g.createLinearGradient(0, Y1, 0, Y0); ag.addColorStop(0, rgba(SA.violet, 0.45)); ag.addColorStop(1, rgba(SA.violet, 0)); g.fillStyle = ag; g.fill();
    g.beginPath(); for (let i = 0; i <= Math.floor(dr); i++) i ? g.lineTo(px(i), py(vals[i])) : g.moveTo(px(i), py(vals[i])); g.lineTo(ex, ey);
    g.strokeStyle = SA.violet; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 5.5, 0, TAU); g.fill();
    const v = Math.round(lerp(120, 312, dr / 11));
    rrect(g, ex - 52, ey - 52, 64, 32, 8); g.fillStyle = '#1e1f2a'; g.fill(); saT(g, String(v), ex - 20, ey - 30, 15, { w: 600, a: 'center' });
    for (let i = 0; i < 12; i += 2) saT(g, `W${i + 1}`, px(i), Y0 + 28, 12, { c: SA.dim, a: 'center', mono: 1 });
    const stat = (cv, lab, val, cap, k, extra) => {
      const g2 = saPanel(cv, 440, 240, 18);
      saT(g2, lab, 28, 46, 16, { c: SA.mute, w: 500 });
      saT(g2, val, 28, 124, 64, { w: 600, ls: -2.5 });
      saT(g2, cap, 28, 160, 14, { c: SA.mute });
      extra(g2, cu(k));
    };
    stat(st.sA, 'Cycle time', `${lerp(1, 4.2, cu(1)).toFixed(1)}×`, 'faster than last quarter', 1, (g2, u) => {
      for (let i = 0; i < 9; i++) { const h = lerp(70, 18, i / 8) * clamp(u * 3 - i * 0.2); rrect(g2, 250 + i * 18, 150 - h, 11, h, 3); g2.fillStyle = i === 8 ? SA.teal : 'rgba(255,255,255,0.14)'; g2.fill(); }
    });
    stat(st.sB, 'Issues shipped', Math.round(lerp(0, 12480, cu(2))).toLocaleString('en-US'), 'across 1,140 teams this year', 2, (g2, u) => {
      rrect(g2, 340, 26, 72, 28, 14); g2.fillStyle = rgba(SA.green, 0.15); g2.fill(); saT(g2, `+${Math.round(38 * u)}%`, 376, 45, 14, { c: SA.green, w: 600, a: 'center' });
    });
    stat(st.sC, 'Uptime', `${lerp(97, 99.99, cu(3)).toFixed(2)}%`, 'last 90 days', 3, (g2, u) => {
      for (let i = 0; i < 30; i++) { if (i / 30 > u) break; rrect(g2, 28 + i * 13, 190, 9, 26, 2); g2.fillStyle = i === 17 ? SA.amber : SA.green; g2.fill(); }
    });
  }

  function saMesh(g, t, k) {
    g.globalCompositeOperation = 'source-over'; g.fillStyle = SA.bg; g.fillRect(0, 0, 320, 180);
    g.globalCompositeOperation = 'lighter';
    [[SA.violet, 0.28, 0.22, 120], [SA.blue, 0.78, 0.25, 110], [SA.pink, 0.62, 0.92, 100], [SA.teal, 0.12, 0.85, 90], [SA.orange, 0.95, 0.75, 70]].forEach(([col, bx, by, r], i) => {
      const x = (bx + 0.14 * vnoise(t * 0.25 + i * 3, i)) * 320, y = (by + 0.16 * vnoise(t * 0.2 + i * 5, i + 7)) * 180;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, 0.5 * k)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 320, 180);
    });
    g.globalCompositeOperation = 'source-over';
  }
  function saCursor(c, x, y, press) {
    c.save(); c.translate(x, y); const s = press ? 1.15 : 1.35; c.scale(s, s);
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    poly(c, [[0, 0], [0, 30], [8, 23], [14, 36], [19, 34], [13, 21], [24, 21]]);
    c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#111'; c.lineWidth = 1.6; c.stroke();
    c.restore();
  }
  function saKeys(c, keys, x, y, a, down) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = `600 30px ${SA_FNT}`;
    const ws = keys.map(k => Math.max(64, c.measureText(k).width + 40)), tw = ws.reduce((s, w) => s + w, 0) + (keys.length - 1) * 14;
    let kx = x - tw / 2;
    keys.forEach((k, i) => {
      const d = down ? 4 : 0;
      rrect(c, kx, y + 6, ws[i], 64, 12); c.fillStyle = '#05050a'; c.fill();
      rrect(c, kx, y + d, ws[i], 64, 12); c.fillStyle = '#1b1c26'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5; c.stroke();
      text(c, k, kx + ws[i] / 2, y + d + 42, { font: SA_FNT, weight: 600, size: 28, align: 'center', color: SA.text });
      kx += ws[i] + 14;
    });
    c.restore();
  }
  function saChip(c, n, s, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(0, (1 - a) * 12);
    c.font = `500 20px ${SA_FNT}`; const w = c.measureText(s).width + 92;
    rrect(c, 96, 34, w, 44, 22); c.fillStyle = 'rgba(20,21,30,0.8)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1; c.stroke();
    text(c, n, 120, 62, { font: SA_MONO, weight: 500, size: 16, color: SA.violet });
    text(c, s, 160, 63, { font: SA_FNT, weight: 500, size: 20, color: SA.text });
    c.restore();
  }

  MG.film({
    id: 'saas', dur: 10, poster: 9.3,
    fonts: [['600 112px Geist', 'Plan less. Ship more. Driftline'], ['400 30px Geist', 'Aa0123456789%×,.'], ['500 16px "Geist Mono"', 'DRF-128 W1 2a9f3c1']],
    meta: {
      family: 'J', name: 'SaaS Product Motion', sub: 'B2B launch film', era: '2010s —',
      origin: 'Software companies now launch features the way carmakers launch cars: with a short film in which the product interface itself is the hero. Through the late 2010s and 2020s teams such as Stripe, Linear and Vercel set the look — a dark stage lit by a drifting gradient mesh, app windows tilted in three-quarter perspective, a cursor demonstrating one feature, numbers counting up, and every move on a spring.',
      works: 'Stripe homepage animated gradient (2020) · Linear product launch and changelog films · Vercel Ship launch keynotes (2023 —) · Figma Config keynote product demos (2020 —)',
      tech: ['3/4 perspective UI cards', 'Cursor-driven feature demo', 'Springs and counters'],
      accent: '#8b7bff',
      motionDNA: 'Every arrival is a damped spring with a touch of overshoot; words rise in a 150 ms stagger and sharpen from blur, the window swings from three-quarter view to flat for the demo and back, satellite cards drift at their own depth for parallax, and numbers count up on an ease-out so they land, not stop.',
      visualDNA: 'Near-black stage under a slow violet–blue–pink gradient mesh, a faint grid, glassy dark cards with 1 px borders and a lit top edge, one violet accent, Geist type with tight tracking, crisp product UI (sidebar, issue rows, command menu, toast) and a cursor as the protagonist.',
      transitions: 'Spring-in headline, window rising in perspective, swing to flat and push in, command-menu scale-in, rows re-sorting on a spring, recede and fly-in of stat cards, fly-out to the logo lock-up',
      implementation: ['Figma → After Effects or Rive', 'React + Framer Motion / CSS springs', 'Canvas 2D (3D planes as affine cells)'],
      reproducibility: 'Fully procedural (fictional product, no real logos)',
      loopable: false,
    },
    setup() {
      const mk = (w, h, ps = 1.5) => offscreen(Math.round(w * ps), Math.round(h * ps));
      return {
        mesh: offscreen(320, 180), win: mk(1400, 860, 1.4), cyc: mk(360, 200), dep: mk(420, 92), ppl: mk(340, 120),
        chart: mk(820, 430), sA: mk(440, 240), sB: mk(440, 240), sC: mk(440, 240),
      };
    },
    draw(c, t, W, H, st) {
      const T = SA_T;
      // stage: gradient mesh, a faint grid, a glow from above
      const mk = lerp(0.55, 0.8, seg(t, 0, 2)) + 0.3 * seg(t, T.outro, T.outro + 1);
      saMesh(st.mesh.getContext('2d'), t, mk);
      c.save(); c.imageSmoothingEnabled = true; c.drawImage(st.mesh, 0, 0, W, H); c.restore();
      c.fillStyle = 'rgba(6,6,11,0.35)'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,0.035)'; c.lineWidth = 1;
      for (let x = 0; x <= W; x += 80) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
      for (let y = 20; y <= H; y += 80) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
      const top = c.createRadialGradient(960, -200, 0, 960, -200, 900); top.addColorStop(0, 'rgba(180,170,255,0.22)'); top.addColorStop(1, 'rgba(180,170,255,0)');
      c.fillStyle = top; c.fillRect(0, 0, W, H);

      // ---- headline ----
      const hu = clamp(spring(t - T.rise, 1.2, 0.85), 0, 1.05), ha = 1 - seg(t, 2.7, 3.15);
      if (ha > 0) {
        c.save(); c.globalAlpha = ha; c.translate(960, lerp(480, 170, hu)); c.scale(lerp(1, 0.62, hu), lerp(1, 0.62, hu)); c.translate(-960, -480);
        const pa = clamp(spring(t - T.pill, 2, 0.7), 0, 1.1);
        if (pa > 0.01) {
          c.save(); c.globalAlpha = ha * clamp(pa); c.translate(0, (1 - pa) * 30);
          c.font = `500 22px ${SA_FNT}`; const pw = c.measureText('Introducing Driftline 2.0').width + 120;
          rrect(c, 960 - pw / 2, 318, pw, 48, 24); c.fillStyle = 'rgba(20,20,32,0.75)'; c.fill();
          const bg = c.createLinearGradient(960 - pw / 2, 0, 960 + pw / 2, 0); bg.addColorStop(0, rgba(SA.violet, 0.9)); bg.addColorStop(0.5, 'rgba(255,255,255,0.15)'); bg.addColorStop(1, rgba(SA.pink, 0.8));
          c.strokeStyle = bg; c.lineWidth = 1.5; c.stroke();
          rrect(c, 960 - pw / 2 + 8, 326, 50, 32, 16); c.fillStyle = SA.violet; c.fill();
          text(c, 'New', 960 - pw / 2 + 33, 348, { font: SA_FNT, weight: 600, size: 15, align: 'center', color: '#fff' });
          text(c, 'Introducing Driftline 2.0  →', 960 - pw / 2 + 72, 350, { font: SA_FNT, weight: 500, size: 22, color: SA.text });
          c.restore();
        }
        const words = ['Plan', 'less.', 'Ship', 'more.'];
        c.font = `600 116px ${SA_FNT}`; if ('letterSpacing' in c) c.letterSpacing = '-4px';
        const ws = words.map(w => c.measureText(w).width), sp = 30, tw = ws.reduce((a, b) => a + b, 0) + sp * 3;
        let x = 960 - tw / 2;
        words.forEach((w, i) => {
          const u = spring(t - T.head - i * 0.15, 1.8, 0.7), a = clamp(u);
          if (a > 0.01) {
            c.save(); c.globalAlpha = ha * a; c.filter = `blur(${((1 - clamp(u)) * 14).toFixed(1)}px)`;
            const gr = c.createLinearGradient(0, 400, 0, 520); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, i > 1 ? '#c7bfff' : '#a9abb8');
            text(c, w, x, 520 + (1 - u) * 50, { font: SA_FNT, weight: 600, size: 116, color: gr, ls: -4 });
            c.restore();
          }
          x += ws[i] + sp;
        });
        if ('letterSpacing' in c) c.letterSpacing = '0px';
        const sa = clamp(spring(t - T.sub, 1.6, 0.8));
        c.globalAlpha = ha * sa;
        text(c, 'The issue tracker that moves at the speed of your team.', 960, 600 + (1 - sa) * 20, { font: SA_FNT, size: 32, align: 'center', color: SA.mute });
        c.restore();
      }

      // ---- the app window and its satellites ----
      const R0 = { x: 960, y: 1700, z: 500, rx: 0.62, ry: -0.3, rz: 0.12 }, R1 = { x: 1010, y: 690, z: 380, rx: 0.5, ry: -0.3, rz: 0.12 };
      const R2 = { x: 960, y: 562, z: -81, rx: 0, ry: 0, rz: 0 }, R3 = { x: 560, y: 600, z: 1400, rx: 0.3, ry: 0.42, rz: -0.05 }, R4 = { x: 560, y: 600, z: 3600, rx: 0.3, ry: 0.42, rz: -0.05 };
      let wp, wa = 1;
      if (t < T.flat) wp = saLerp(R0, R1, spring(t - T.rise, 0.9, 0.8));
      else if (t < T.back) { const s2 = spring(t - T.flat, 1.0, 0.82); wp = saLerp(R1, R2, s2); if (t - T.flat > 1.2) wp = R2; }
      else if (t < T.outro) { wp = saLerp(R2, R3, spring(t - T.back, 1.0, 0.85)); wa = lerp(1, 0.5, seg(t, T.back, T.back + 0.8)); }
      else { wp = saLerp(R3, R4, E.inC(seg(t, T.outro, T.outro + 0.7))); wa = 0.5 * (1 - seg(t, T.outro, T.outro + 0.6)); }
      const cards = [];
      if (t > T.rise && wa > 0) { saWindow(st.win, t); cards.push([st.win, 1400, 860, wp, wa, 'win']); }
      if (t > T.sats && t < T.flat + 0.5) {
        saSats(st, t);
        [[st.cyc, 360, 200, 470, 520, 100, 0], [st.dep, 420, 92, 1500, 300, 40, 1], [st.ppl, 340, 120, 1560, 880, -60, 2]].forEach(([cv, w, h, x, y, z, k]) => {
          const u = spring(t - T.sats - k * 0.15, 1.4, 0.7), out = E.inC(seg(t, T.flat - 0.05 + k * 0.05, T.flat + 0.4 + k * 0.05));
          const p = { x: x + (x - 960) * 0.9 * out, y: y + Math.sin(t * 1.2 + k * 2) * 10 + (1 - u) * 160, z: z + (1 - u) * 700 - out * 300, rx: 0.5, ry: -0.3, rz: 0.12 };
          cards.push([cv, w, h, p, clamp(u) * (1 - out), 'sat']);
        });
      }
      if (t > T.stats) {
        saStats(st, t);
        const Rq = { rx: 0.26, ry: -0.3, rz: 0.06 };
        [[st.chart, 820, 430, 760, 450, 140, 0], [st.sA, 440, 240, 1450, 250, 40, 1], [st.sB, 440, 240, 1500, 530, -10, 2], [st.sC, 440, 240, 1440, 805, -60, 3]].forEach(([cv, w, h, x, y, z, k]) => {
          const u = spring(t - T.stats - k * 0.13, 1.2, 0.75), out = E.inC(seg(t, T.outro + k * 0.05, T.outro + 0.6 + k * 0.05));
          const p = { x: x + (1 - u) * 700 + out * (x - 960) * 0.6, y: y + Math.sin(t * 1.1 + k * 1.7) * 8, z: z + (1 - u) * 500 - out * 600, ...Rq };
          cards.push([cv, w, h, p, clamp(u) * (1 - out), 'stat']);
        });
      }
      cards.sort((a, b) => b[3].z - a[3].z);
      let WP = null;
      cards.forEach(([cv, w, h, p, a, kind]) => { const P = saCard(c, cv, w, h, p, a); if (kind === 'win') WP = P; });

      // ---- the demo: cursor, keys, ripple ----
      if (WP && t > T.cursor && t < T.back + 0.3) {
        const rowY = SA_L0.rows[128] + 25;
        const tgt = WP(620, rowY), away = WP(1250, 720);
        let cx, cy;
        if (t < T.enter) { const u = E.ioC(seg(t, T.cursor, T.click - 0.05)); cx = lerp(1780, tgt[0], u); cy = lerp(1080, tgt[1], u) - Math.sin(u * PI) * 60; }
        else { const u = E.ioC(seg(t, T.enter + 0.2, T.enter + 0.8)); cx = lerp(tgt[0], away[0], u); cy = lerp(tgt[1], away[1], u); }
        const rp = t - T.click;
        if (rp > 0 && rp < 0.5) { c.strokeStyle = rgba(SA.violet, 0.8 * (1 - rp / 0.5)); c.lineWidth = 3; c.beginPath(); c.arc(tgt[0], tgt[1], 10 + rp * 120, 0, TAU); c.stroke(); }
        c.globalAlpha = 1 - seg(t, T.back, T.back + 0.3);
        saCursor(c, cx, cy, rp > -0.04 && rp < 0.12);
        c.globalAlpha = 1;
      }
      saKeys(c, ['⌘', 'K'], 960, 960, seg(t, T.kbd - 0.1, T.kbd) * (1 - seg(t, T.kbd + 0.3, T.kbd + 0.45)), t > T.kbd && t < T.kbd + 0.2);
      saKeys(c, ['Enter ↵'], 960, 960, seg(t, T.enter - 0.15, T.enter - 0.05) * (1 - seg(t, T.enter + 0.4, T.enter + 0.55)), t > T.enter && t < T.enter + 0.18);
      saChip(c, '01', 'Command menu — every action, two keys away', E.outC(seg(t, T.flat + 0.4, T.flat + 0.8)) * (1 - seg(t, T.back - 0.2, T.back)));
      saChip(c, '02', 'Insights — see the cycle, not just the tickets', E.outC(seg(t, T.stats + 0.2, T.stats + 0.6)) * (1 - seg(t, T.outro - 0.2, T.outro)));

      // ---- outro: logo lock-up and call to action ----
      if (t > T.logo) {
        const lu = spring(t - T.logo, 1.5, 0.55), la = clamp(lu * 1.5), wu = spring(t - T.logo - 0.15, 1.4, 0.8);
        const glow = c.createRadialGradient(960, 470, 0, 960, 470, 600); glow.addColorStop(0, rgba(SA.violet, 0.3 * la)); glow.addColorStop(1, rgba(SA.violet, 0));
        c.fillStyle = glow; c.fillRect(0, 0, W, H);
        c.font = `600 104px ${SA_FNT}`; if ('letterSpacing' in c) c.letterSpacing = '-3px';
        const tw = c.measureText('Driftline').width; if ('letterSpacing' in c) c.letterSpacing = '0px';
        const ms = 112, gx = 960 - (ms + 34 + tw) / 2;
        c.save(); c.translate(gx + ms / 2, 470); c.scale(lu, lu); c.rotate((1 - clamp(lu)) * -0.4); saMark(c, 0, 0, ms); c.restore();
        c.save(); c.globalAlpha = clamp(wu); c.filter = `blur(${((1 - clamp(wu)) * 10).toFixed(1)}px)`;
        text(c, 'Driftline', gx + ms + 34 + (1 - wu) * 40, 506, { font: SA_FNT, weight: 600, size: 104, color: '#fff', ls: -3 });
        c.restore();
        const ta = clamp(spring(t - T.logo - 0.3, 1.5, 0.8));
        c.globalAlpha = ta; text(c, 'Plan less. Ship more.', 960, 590 + (1 - ta) * 16, { font: SA_FNT, size: 36, align: 'center', color: SA.mute }); c.globalAlpha = 1;
        const cu = clamp(spring(t - T.cta, 1.8, 0.65), 0, 1.1);
        if (cu > 0.01) {
          c.save(); c.globalAlpha = clamp(cu); c.translate(960, 690); c.scale(lerp(0.9, 1, cu), lerp(0.9, 1, cu));
          const sw = (t * 0.6) % 1, bw = c.createLinearGradient(-340, 0, 340, 0);
          bw.addColorStop(0, SA.violet); bw.addColorStop(clamp(sw), SA.pink); bw.addColorStop(1, SA.blue);
          rrect(c, -332, -38, 340, 76, 38); c.fillStyle = bw; c.fill();
          rrect(c, -330, -36, 336, 72, 36); c.fillStyle = '#f5f5fa'; c.fill();
          text(c, 'Start building  →', -162, 10, { font: SA_FNT, weight: 600, size: 26, align: 'center', color: '#0b0b12' });
          rrect(c, 26, -36, 300, 72, 36); c.fillStyle = 'rgba(255,255,255,0.04)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1.5; c.stroke();
          text(c, 'Read the changelog', 176, 10, { font: SA_FNT, weight: 500, size: 24, align: 'center', color: SA.text });
          c.restore();
        }
        c.globalAlpha = clamp(spring(t - T.cta - 0.3, 1.5, 0.8));
        text(c, 'SAAS PRODUCT MOTION  ·  after Linear, Stripe and Vercel launch films  ·  fictional product', 960, 1010, { font: SA_MONO, weight: 500, size: 18, align: 'center', color: SA.mute, ls: 2 });
        c.globalAlpha = 1;
      }
      grain(c, W, H, t, 0.035, 'overlay');
      vignette(c, W, H, 0.45);
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const B = 60 / 112;
      // airy pad progression under the whole film
      [[0, [53, 60, 64, 67, 72], 3.25], [3.15, [50, 57, 62, 65, 69], 3.05], [6.1, [48, 55, 60, 64, 71], 2.1], [8.15, [53, 60, 65, 69, 72, 76], 1.85]].forEach(([t, n, d]) =>
        A.chord(t, n, { type: 'triangle', dur: d, g: 0.024, a: 0.5, hold: true, rel: 0.5, lp: 1800, spread: 6, width: 0.8, rev: 0.5 }));
      // a pluck as each headline word lands
      [72, 76, 79, 84].forEach((m, i) => A.pluck(SA_T.head + i * 0.15 + 0.1, midi(m), { g: 0.12, bright: 0.4, dur: 1.2, rev: 0.3, pan: (i - 1.5) * 0.25 }));
      [SA_T.rise, SA_T.flat, SA_T.back, SA_T.outro].forEach(t => A.whoosh(t - 0.1, 0.6, { f1: 250, f2: 4000, g: 0.07 }));
      [0, 1, 2].forEach(k => A.pluck(SA_T.sats + k * 0.15 + 0.1, midi([79, 83, 86][k]), { g: 0.08, bright: 0.5, dur: 0.8, rev: 0.3 }));
      // soft pulse from the reveal to the outro
      for (let t = SA_T.rise; t < SA_T.outro; t += B) { A.kick(t, 0.28, { f: 120, f2: 45, dur: 0.3 }); A.hat(t + B / 2, 0.03, false, { pan: 0.2 }); }
      // UI foley: click, ⌘K, typing, Enter, success chime
      A.noise(SA_T.click, { type: 'highpass', f: 5000, dur: 0.02, g: 0.12 }); A.osc(SA_T.click, { f: 1800, dur: 0.03, g: 0.035 });
      [SA_T.kbd, SA_T.kbd + 0.06].forEach(t => A.noise(t, { type: 'bandpass', f: 2200, q: 2, dur: 0.03, g: 0.1 }));
      for (let k = 0; k < SA_TYPED.length; k++) A.noise(SA_T.type[0] + k * (SA_T.type[1] - SA_T.type[0]) / SA_TYPED.length, { type: 'bandpass', f: 2600 + hash(k) * 1200, q: 2, dur: 0.02, g: 0.07, pan: (hash(k + 3) - 0.5) * 0.4 });
      A.noise(SA_T.enter, { type: 'bandpass', f: 1500, q: 1.5, dur: 0.05, g: 0.12 });
      A.bell(SA_T.enter + 0.05, midi(88), { g: 0.045, dur: 0.9, rev: 0.4 }); A.bell(SA_T.enter + 0.17, midi(95), { g: 0.035, dur: 1.1, rev: 0.4 });
      // counters ticking up
      for (let k = 0; k < 26; k++) A.osc(SA_T.stats + 0.4 + k * 0.045, { f: 2200 + k * 45, dur: 0.02, g: 0.012, pan: 0.3 });
      // logo
      A.impact(SA_T.logo, 0.28);
      A.bell(SA_T.logo + 0.05, midi(84), { g: 0.06, dur: 1.6, rev: 0.6 });
      [72, 76, 79, 84, 88].forEach((m, i) => A.pluck(SA_T.cta + i * 0.08, midi(m), { g: 0.08, bright: 0.45, dur: 1.2, rev: 0.4, pan: (i - 2) * 0.2 }));
    },
  });
})();
