/* batch e4 — Family I: Cultural & Regional.
   shadowpuppet (皮影戏 Chinese shadow play) · dunhuang (敦煌壁画 Mogao murals) · papelpicado (Mexican cut-paper banners). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@600;900&family=Cormorant+SC:wght@500;700&family=Cormorant+Garamond:ital,wght@1,500&family=Ultra&family=Alegreya+SC:wght@700&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  // closed smooth path through points (quadratic through midpoints)
  function smooth(g, pts, closed = true) {
    const n = pts.length;
    if (!closed) {
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
      g.lineTo(pts[n - 1][0], pts[n - 1][1]);
      return;
    }
    const mid = i => { const a = pts[i % n], b = pts[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const m0 = mid(n - 1);
    g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i); g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    g.closePath();
  }
  const poly = (g, pts) => { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  const ell = (g, x, y, rx, ry, a = 0) => { g.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); g.ellipse(x, y, rx, ry, a, 0, TAU); };
  const tpt = (g, x, y) => { const m = g.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
  const bump = (t, a, up, hold, down) => E.outQ(seg(t, a, a + up)) * (1 - E.ioS(seg(t, a + up + hold, a + up + hold + down)));

  /* =====================================================================
     01  SHADOW PUPPETRY 皮影戏 — dyed leather on a lamp-lit cloth screen
     ===================================================================== */
  const SP = {
    red: '#d63b28', redD: '#9e2216', green: '#2f9455', greenD: '#1d6a3a', yellow: '#efbd3a', yellowD: '#c98d1c',
    blue: '#2c5a8c', black: '#25160d', hide: '#eec58b', line: '#2a1206', sole: '#f3dcb0',
  };
  const SCR = { x: 92, y: 58, w: 1736, h: 896 };
  const BASE = SCR.y + SCR.h - 20;   // where feet and hooves meet the bottom of the screen

  // one leather part: dye, mottling, inner-edge darkening, hollowed cuts, carved outline
  function leather(bb, shape, o = {}) {
    const pad = 12, w = Math.ceil(bb[2] - bb[0] + pad * 2), h = Math.ceil(bb[3] - bb[1] + pad * 2);
    const cv = offscreen(w, h), g = cv.getContext('2d'), r = rng(o.seed || 7);
    const ox = pad - bb[0], oy = pad - bb[1];
    g.translate(ox, oy);
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (o.union) { g.beginPath(); shape(g); g.lineWidth = (o.lw ?? 3.4) * 2; g.strokeStyle = SP.line; g.stroke(); }
    g.beginPath(); shape(g); g.fillStyle = o.dye || SP.hide; g.fill();
    g.save(); g.beginPath(); shape(g); g.clip();
    if (o.paint) o.paint(g, r);
    for (let i = 0; i < 26; i++) {
      const x = lerp(bb[0], bb[2], r()), y = lerp(bb[1], bb[3], r()), rr = 10 + r() * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, r() < 0.55 ? 'rgba(70,25,0,0.13)' : 'rgba(255,240,200,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    g.beginPath(); shape(g); g.lineWidth = o.edge ?? 12; g.strokeStyle = 'rgba(70,24,4,0.3)'; g.stroke();
    if (o.cuts) { g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; o.cuts(g, r); g.globalCompositeOperation = 'source-over'; }
    g.restore();
    if (!o.union) { g.beginPath(); shape(g); g.lineWidth = o.lw ?? 3.4; g.strokeStyle = SP.line; g.stroke(); }
    if (o.lines) { g.strokeStyle = SP.line; g.fillStyle = SP.line; o.lines(g, r); }
    return { cv, ox, oy };
  }
  const spr = (g, S) => g.drawImage(S.cv, -S.ox, -S.oy);

  // cut-pattern vocabulary (drawn with destination-out)
  const cut = {
    scales(g, x0, y0, x1, y1, R, lw = 2.2) {
      g.lineWidth = lw;
      for (let j = 0, y = y0; y < y1; j++, y += R * 0.95) for (let x = x0 + (j % 2) * R; x < x1; x += R * 2) { g.beginPath(); g.arc(x, y, R * 0.92, 0.12 * PI, 0.88 * PI); g.stroke(); }
    },
    flower(g, x, y, R, n = 6, rot = 0) {
      for (let k = 0; k < n; k++) { const a = rot + k / n * TAU; g.beginPath(); ell(g, x + Math.cos(a) * R * 0.56, y + Math.sin(a) * R * 0.56, R * 0.4, R * 0.17, a); g.fill(); }
      g.beginPath(); g.arc(x, y, R * 0.16, 0, TAU); g.fill();
    },
    ring(g, x, y, R, lw = 2.5) { g.lineWidth = lw; g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); },
    curl(g, x, y, R, dir = 1, lw = 2.4) {
      g.lineWidth = lw; g.beginPath();
      for (let i = 0; i <= 30; i++) { const u = i / 30, a = dir * u * TAU * 1.25, rr = R * (1 - u * 0.8); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    },
    dots(g, pts, R) { pts.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); }); },
    slits(g, x0, y0, x1, y1, n, len, ang, lw = 2) {
      g.lineWidth = lw;
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke(); }
    },
    rim(g, pts, inset = 8, step = 11, R = 2.2) {   // punched dot border just inside a contour
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
        for (let k = 0; k < n; k++) {
          const x = lerp(a[0], b[0], k / n), y = lerp(a[1], b[1], k / n), dx = cx - x, dy = cy - y, l = Math.hypot(dx, dy) || 1;
          if (l < inset * 2) continue;
          g.beginPath(); g.arc(x + dx / l * inset, y + dy / l * inset, R, 0, TAU); g.fill();
        }
      }
    },
    meander(g, x0, y, x1, s, lw = 2.2) {   // 回纹 key fret strip
      g.lineWidth = lw; g.beginPath();
      for (let x = x0; x + s <= x1; x += s) { g.moveTo(x, y + s * 0.5); g.lineTo(x, y - s * 0.4); g.lineTo(x + s * 0.7, y - s * 0.4); g.lineTo(x + s * 0.7, y + s * 0.2); g.lineTo(x + s * 0.3, y + s * 0.2); g.lineTo(x + s * 0.3, y - s * 0.05); }
      g.stroke();
    },
  };

  /* --- the general: head, torso, skirt, limbs, back flags, weapon --- */
  function makeGeneral(kind) {
    const hero = kind === 'hero';
    const armor = hero ? SP.green : SP.yellow, armorD = hero ? SP.greenD : SP.yellowD, trim = hero ? SP.yellow : SP.blue;
    const robe = hero ? SP.green : SP.blue, flag = hero ? SP.red : SP.green, seed = hero ? 11 : 37;
    const P = {};
    // HEAD — pivot at the neck
    const face = [[27, -94], [29, -80], [36, -56], [38, -50], [31, -46], [33, -40], [28, -34], [30, -28], [22, -21], [6, -19], [-6, -30], [-9, -62], [-2, -94]];
    P.head = leather([-250, -360, 70, 110], g => {
      poly(g, [[-9, 4], [9, 4], [8, -22], [-8, -22]]);
      g.moveTo(face[0][0], face[0][1]); face.forEach(p => g.lineTo(p[0], p[1])); g.closePath();
      // helmet
      smooth(g, [[-24, -86], [-18, -118], [4, -134], [30, -124], [40, -100], [34, -92], [-2, -90]]);
      // neck guard / ear flaps
      smooth(g, [[-10, -90], [-30, -84], [-38, -40], [-30, -10], [-14, -14], [-10, -60]]);
      if (hero) { ell(g, 6, -150, 14, 14); ell(g, 38, -110, 9, 9); }
      else { poly(g, [[-6, -128], [6, -190], [14, -128]]); poly(g, [[22, -122], [52, -150], [34, -112]]); ell(g, 10, -132, 10, 8); }
    }, {
      dye: hero ? SP.red : SP.black, seed, edge: 8,
      paint(g) {
        g.fillStyle = hero ? SP.green : SP.yellow;
        g.beginPath(); smooth(g, [[-24, -86], [-18, -118], [4, -134], [30, -124], [40, -100], [34, -92], [-2, -90]]); g.fill();
        g.beginPath(); smooth(g, [[-10, -90], [-30, -84], [-38, -40], [-30, -10], [-14, -14], [-10, -60]]); g.fill();
        g.fillStyle = SP.red; g.beginPath(); if (hero) { ell(g, 6, -150, 14, 14); ell(g, 38, -110, 9, 9); } else ell(g, 10, -132, 10, 8); g.fill();
        if (!hero) { g.fillStyle = SP.yellow; g.beginPath(); poly(g, [[-6, -128], [6, -190], [14, -128]]); poly(g, [[22, -122], [52, -150], [34, -112]]); g.fill(); }
        g.fillStyle = SP.hide; g.beginPath(); poly(g, [[-9, 4], [9, 4], [8, -22], [-8, -22]]); g.fill();
      },
      cuts(g) {
        cut.scales(g, -30, -76, -12, -16, 6, 1.8);
        cut.dots(g, [[-14, -112], [-4, -120], [8, -124], [20, -118], [30, -108]], 2.6);
        cut.curl(g, 8, -104, 9, 1, 2.2);
        cut.ring(g, 6, -150, 7, 2); cut.flower(g, 22, -100, 7, 5);
        if (!hero) { cut.slits(g, 0, -175, 8, -140, 4, 8, 0, 1.8); }
      },
      lines(g) {
        // the long almond eye and sweeping brows of the profile
        g.lineWidth = 3; g.beginPath(); g.moveTo(12, -62); g.quadraticCurveTo(22, -67, 31, -63); g.quadraticCurveTo(22, -60, 12, -62); g.stroke();
        if (hero) { g.beginPath(); g.ellipse(25, -63.5, 2.4, 2, 0, 0, TAU); g.fillStyle = '#fff2d8'; g.fill(); }
        g.lineWidth = hero ? 6 : 5; g.beginPath(); g.moveTo(8, -70); g.quadraticCurveTo(20, -76, 32, -74); g.stroke();
        g.lineWidth = 2.2; g.beginPath(); g.moveTo(32, -42); g.lineTo(26, -40); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.moveTo(-2, -60); g.quadraticCurveTo(4, -50, 0, -40); g.stroke();
        // plumes: two pheasant tail feathers 翎子 curving back
        const feather = (x0, y0, cx, cy, x1, y1, w) => {
          const N = 46;
          for (let i = 0; i < N; i++) {
            const u0 = i / N, u1 = (i + 1) / N, q = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
            const a = q(u0), b = q(u1);
            g.strokeStyle = i % 3 === 0 ? SP.line : (hero ? '#c97a2c' : '#8a5a20');
            g.lineWidth = w * (1 - u0 * 0.75); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
          }
        };
        feather(-2, -120, -40, -330, -240, -340, 9);
        feather(6, -122, -10, -300, -170, -350, 8);
        if (hero) {   // the long five-strand beard
          g.strokeStyle = SP.line;
          for (let k = 0; k < 9; k++) {
            const x0 = 4 + k * 2.6, y0 = -30 + k * 0.6;
            g.lineWidth = 2.6 - k * 0.12; g.beginPath(); g.moveTo(x0, y0);
            g.bezierCurveTo(x0 + 6, y0 + 40, x0 + 18 - k, y0 + 70, x0 + 10 + k * 1.5, y0 + 112 + (k % 3) * 8); g.stroke();
          }
        }
      },
    });
    // TORSO — pivot at the waist; neck (4,-150), shoulders (24,-126)/(-22,-128)
    const tor = [[-34, 4], [-40, -40], [-44, -100], [-36, -138], [-14, -152], [12, -154], [34, -140], [48, -110], [46, -60], [38, -20], [30, 4]];
    P.torso = leather([-50, -160, 56, 10], g => smooth(g, tor), {
      dye: robe, seed: seed + 1,
      paint(g) {
        g.fillStyle = armor; g.beginPath(); smooth(g, [[-38, -70], [-40, -120], [-20, -146], [20, -148], [44, -116], [44, -70], [4, -60]]); g.fill();
        g.fillStyle = SP.red; g.fillRect(-46, -36, 100, 15);
        g.fillStyle = trim; g.beginPath(); g.arc(24, -96, 20, 0, TAU); g.fill();
      },
      cuts(g) {
        cut.scales(g, -40, -136, 46, -70, 7);
        cut.rim(g, tor, 9, 10, 2);
        cut.flower(g, -14, -100, 9, 6); cut.flower(g, 6, -124, 7, 5);
        cut.ring(g, 24, -96, 12, 2.4); cut.flower(g, 24, -96, 8, 6);
        cut.dots(g, [-34, -20, -6, 8, 22, 36].map(x => [x, -28.5]), 2.6);
        cut.curl(g, -18, -6, 10, 1); cut.curl(g, 12, -6, 10, -1);
      },
      lines(g) { g.lineWidth = 2.4; g.beginPath(); g.moveTo(-38, -70); g.quadraticCurveTo(4, -56, 44, -70); g.stroke(); },
    });
    // BACK FLAGS 靠旗 — pivot on the back
    P.flags = leather([-200, -240, 30, 20], g => {
      for (let k = 0; k < 4; k++) {
        const a = -PI / 2 - 0.35 - k * 0.24, c = Math.cos(a), s = Math.sin(a), L = 200 - k * 12;
        g.moveTo(0, 0); g.lineTo(c * L, s * L); g.lineTo(c * L * 0.55 + Math.cos(a - 0.5) * 70, s * L * 0.55 + Math.sin(a - 0.5) * 70); g.closePath();
      }
    }, {
      dye: flag, seed: seed + 2, edge: 8,
      cuts(g) {
        for (let k = 0; k < 4; k++) {
          const a = -PI / 2 - 0.35 - k * 0.24;
          const x = Math.cos(a) * 120 + Math.cos(a - 0.5) * 22, y = Math.sin(a) * 120 + Math.sin(a - 0.5) * 22;
          cut.flower(g, x, y, 12, 5, k); cut.curl(g, Math.cos(a) * 70 + Math.cos(a - 0.5) * 14, Math.sin(a) * 70 + Math.sin(a - 0.5) * 14, 7, 1, 2);
        }
      },
      lines(g) {
        g.lineWidth = 4.5;
        for (let k = 0; k < 4; k++) { const a = -PI / 2 - 0.35 - k * 0.24, L = 210 - k * 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke(); g.beginPath(); g.arc(Math.cos(a) * L, Math.sin(a) * L, 5, 0, TAU); g.fillStyle = SP.red; g.fill(); g.stroke(); }
      },
    });
    // LOWER — armoured skirt; hips (12,40)/(-14,40)
    P.lower = leather([-58, -6, 54, 122], g => smooth(g, [[-40, -2], [36, -2], [48, 60], [46, 112], [12, 104], [-20, 116], [-52, 106], [-50, 52]]), {
      dye: armor, seed: seed + 3,
      paint(g) { g.fillStyle = SP.red; g.beginPath(); smooth(g, [[6, 10], [34, 10], [38, 90], [22, 110], [6, 92]]); g.fill(); },
      cuts(g) { cut.scales(g, -48, 14, 4, 100, 7.5); cut.rim(g, [[-40, -2], [36, -2], [48, 60], [46, 112], [12, 104], [-20, 116], [-52, 106], [-50, 52]], 8, 11, 2); cut.curl(g, 22, 40, 9, 1); cut.curl(g, 22, 72, 8, -1); cut.dots(g, [[-40, 8], [-26, 8], [-12, 8], [2, 8]], 2.6); },
      lines(g) {
        g.lineWidth = 2.2;
        for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(10 + k * 6, 104); g.lineTo(9 + k * 6, 122); g.stroke(); }
      },
    });
    P.thigh = leather([-18, -10, 18, 100], g => smooth(g, [[-16, -6], [16, -6], [14, 50], [13, 96], [-13, 96], [-15, 50]]), {
      dye: robe, seed: seed + 4, edge: 7, cuts(g) { cut.flower(g, 0, 30, 9, 5); cut.slits(g, -8, 64, 8, 64, 4, 14, PI / 2, 1.8); cut.rim(g, [[-16, -6], [16, -6], [14, 50], [13, 96], [-13, 96], [-15, 50]], 6, 10, 1.8); },
    });
    P.shin = leather([-20, -8, 60, 134], g => poly(g, [[-13, -4], [13, -4], [14, 88], [26, 98], [50, 108], [58, 124], [-18, 128], [-16, 98]]), {
      dye: SP.black, seed: seed + 5, edge: 6,
      paint(g) { g.fillStyle = SP.sole; g.fillRect(-20, 114, 82, 16); g.fillStyle = trim; g.fillRect(-16, -6, 32, 18); },
      cuts(g) { cut.curl(g, 0, 46, 8, 1, 2); cut.dots(g, [[-6, 4], [6, 4], [0, 72], [24, 106], [38, 110]], 2.2); cut.slits(g, -14, 122, 54, 122, 9, 0.1, 0, 3); },
    });
    P.uarm = leather([-26, -22, 26, 78], g => smooth(g, [[-20, -14], [0, -22], [22, -12], [16, 40], [14, 74], [-12, 76], [-16, 30]]), {
      dye: armor, seed: seed + 6, edge: 7, paint(g) { g.fillStyle = robe; g.fillRect(-20, 44, 40, 40); }, cuts(g) { cut.scales(g, -16, -10, 18, 38, 6, 1.8); cut.flower(g, 0, 58, 7, 5); cut.rim(g, [[-20, -14], [0, -22], [22, -12], [16, 40], [14, 74], [-12, 76], [-16, 30]], 6, 10, 1.8); },
    });
    P.farm = leather([-16, -6, 16, 74], g => smooth(g, [[-12, -2], [12, -2], [15, 40], [12, 70], [-11, 72], [-14, 40]]), {
      dye: robe, seed: seed + 7, edge: 6, paint(g) { g.fillStyle = trim; g.fillRect(-16, 50, 32, 26); },
      cuts(g) { cut.flower(g, 0, 24, 8, 5); cut.slits(g, -8, 56, 8, 56, 4, 12, PI / 2, 1.8); },
    });
    P.hand = leather([-14, -4, 18, 30], g => smooth(g, [[-10, 0], [8, -2], [16, 12], [12, 26], [-6, 28], [-12, 14]]), { dye: SP.hide, seed: seed + 8, edge: 4, lines(g) { g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 14); g.lineTo(12, 14); g.stroke(); } });
    // WEAPON — along +x from the grip
    if (hero) {   // guandao: crescent blade, dragon-mouth collar, red tassel
      P.weapon = leather([-300, -70, 420, 50], g => {
        g.rect(-280, -5, 516, 10);
        poly(g, [[-280, -7], [-298, 0], [-280, 7]]);
        // broad crescent blade: convex edge below, notch and back spike above
        g.moveTo(236, -14); g.lineTo(262, -18); g.quadraticCurveTo(300, -20, 326, -28); g.lineTo(318, -50); g.lineTo(344, -30);
        g.quadraticCurveTo(380, -34, 414, -62); g.quadraticCurveTo(410, -10, 372, 18); g.quadraticCurveTo(320, 44, 262, 30); g.quadraticCurveTo(244, 22, 236, 14); g.closePath();
        smooth(g, [[214, -16], [232, -20], [244, 0], [232, 20], [214, 16]]);
      }, {
        dye: SP.yellow, seed: 91, edge: 6,
        paint(g) { g.fillStyle = SP.red; g.fillRect(-280, -6, 496, 12); g.fillStyle = SP.green; g.beginPath(); smooth(g, [[214, -16], [232, -20], [244, 0], [232, 20], [214, 16]]); g.fill(); },
        cuts(g) { cut.curl(g, 300, 4, 15, 1); cut.flower(g, 352, -8, 10, 5); cut.curl(g, 266, 6, 9, -1); cut.dots(g, [[390, -30], [378, -18], [330, -12]], 2.6); cut.slits(g, -240, 0, 200, 0, 22, 0.1, 0, 3.2); cut.ring(g, 228, 0, 8, 2); },
        lines(g) {
          g.lineWidth = 2; g.beginPath(); g.moveTo(250, 22); g.quadraticCurveTo(330, 34, 396, -28); g.stroke();
          g.strokeStyle = SP.red;
          for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(206, 12); g.quadraticCurveTo(196 - k * 2, 40, 188 - k * 4, 62 + k * 2); g.stroke(); }
        },
      });
    } else {      // spear: diamond head, tuft
      P.weapon = leather([-260, -26, 330, 26], g => { g.rect(-250, -4, 500, 8); poly(g, [[244, -12], [326, 0], [244, 12], [236, 0]]); }, {
        dye: SP.hide, seed: 92, edge: 4, paint(g) { g.fillStyle = SP.yellow; g.beginPath(); poly(g, [[244, -12], [326, 0], [244, 12], [236, 0]]); g.fill(); },
        cuts(g) { cut.slits(g, -230, 0, 220, 0, 20, 0.1, 0, 2.6); cut.dots(g, [[270, 0], [292, 0]], 2.5); },
        lines(g) { g.lineWidth = 2; g.strokeStyle = SP.red; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(234, 0); g.quadraticCurveTo(220, 14 + k, 206 - k * 3, 30 + k * 3); g.stroke(); } },
      });
    }
    return P;
  }

  function makeHorse() {
    const H = {};
    const body = g => { g.moveTo(-160, -34); g.bezierCurveTo(-120, -80, 40, -64, 112, -66); g.bezierCurveTo(168, -60, 186, 6, 156, 42); g.bezierCurveTo(100, 64, -60, 60, -124, 44); g.bezierCurveTo(-178, 30, -188, -12, -160, -34); g.closePath(); };
    const cloth = [[-80, -66], [30, -64], [36, 34], [-86, 36]];
    H.body = leather([-190, -110, 190, 70], g => { body(g); smooth(g, [[-60, -90], [-30, -70], [10, -70], [34, -94], [16, -60], [-52, -60]]); }, {
      dye: SP.red, seed: 51,
      paint(g) {
        g.fillStyle = SP.green; g.beginPath(); poly(g, cloth); g.fill();
        g.fillStyle = SP.yellow; g.beginPath(); smooth(g, [[-60, -90], [-30, -70], [10, -70], [34, -94], [16, -60], [-52, -60]]); g.fill();
        g.fillRect(-86, 24, 122, 14); g.fillRect(-86, -66, 10, 100); g.fillRect(26, -66, 10, 100);
      },
      cuts(g) {
        cut.flower(g, -134, -12, 15, 6); cut.ring(g, -134, -12, 22, 2); cut.flower(g, 120, -14, 14, 6, 0.4); cut.ring(g, 120, -14, 21, 2);
        cut.curl(g, -150, 18, 9, 1); cut.curl(g, 138, 22, 9, -1); cut.curl(g, -106, 26, 8, -1); cut.curl(g, 96, 30, 8, 1);
        cut.flower(g, -24, -14, 20, 8); cut.ring(g, -24, -14, 28, 2.4);
        cut.scales(g, -72, -54, 28, 20, 6, 1.6);
        cut.dots(g, [-76, -60, -44, -28, -12, 4, 20].map(x => [x, 31]), 2.6);
        cut.dots(g, [[-100, -50], [60, -52], [74, -40], [-116, -40]], 3);
      },
      lines(g) {
        g.lineWidth = 2.6; g.beginPath(); g.moveTo(-60, -90); g.quadraticCurveTo(-14, -56, 34, -94); g.stroke();
        // breast strap and crupper with tassels
        g.strokeStyle = SP.yellowD; g.lineWidth = 5; g.beginPath(); g.moveTo(36, -40); g.quadraticCurveTo(110, -10, 160, -20); g.moveTo(-86, -40); g.quadraticCurveTo(-140, -20, -168, -30); g.stroke();
        g.strokeStyle = SP.line; g.lineWidth = 1.6;
        [[80, -14], [118, -12], [-124, -26], [-150, -28]].forEach(([x, y]) => { for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4 + k * 2, y + 22); g.stroke(); } g.fillStyle = SP.red; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.stroke(); });
        g.lineWidth = 2; g.beginPath(); g.moveTo(-26, 36); g.lineTo(-26, 64); g.stroke(); g.beginPath(); g.ellipse(-26, 70, 12, 6, 0, 0, TAU); g.stroke();
      },
    });
    const neck = [[-46, 20], [-44, -30], [-22, -84], [12, -126], [40, -150], [62, -152], [82, -138], [100, -112], [118, -88], [131, -72], [133, -60], [121, -52], [100, -58], [84, -72], [70, -68], [56, -46], [44, -8], [36, 28]];
    H.neck = leather([-80, -200, 150, 50], g => { smooth(g, neck); poly(g, [[42, -146], [46, -190], [64, -150]]); }, {
      dye: SP.red, seed: 52, edge: 9,
      cuts(g) { cut.rim(g, neck, 9, 12, 2.2); cut.curl(g, 4, -30, 11, 1); cut.flower(g, 18, -74, 10, 5); cut.curl(g, 36, -100, 8, -1); cut.dots(g, [[123, -64]], 3.2); cut.slits(g, -30, 0, 30, -112, 9, 10, -PI * 0.25, 2); },
      lines(g) {
        // mane: fine carved strands along the crest
        for (let k = 0; k < 26; k++) {
          const u = k / 25, x = lerp(-44, 52, u) + Math.sin(u * PI) * -18, y = lerp(-10, -158, Math.pow(u, 0.9));
          g.lineWidth = 2.4 - u; g.beginPath(); g.moveTo(x + 6, y + 4); g.quadraticCurveTo(x - 20, y - 2, x - 34 + u * 10, y + 16 + (k % 3) * 6); g.stroke();
        }
        g.lineWidth = 3; g.beginPath(); g.moveTo(80, -116); g.quadraticCurveTo(89, -122, 98, -114); g.quadraticCurveTo(89, -110, 80, -116); g.stroke();
        g.strokeStyle = SP.yellowD; g.lineWidth = 5; g.beginPath(); g.moveTo(58, -146); g.quadraticCurveTo(100, -100, 126, -66); g.moveTo(98, -124); g.lineTo(96, -64); g.moveTo(112, -62); g.quadraticCurveTo(60, -10, 10, 30); g.stroke();
        g.strokeStyle = SP.red; g.lineWidth = 2;
        for (let k = 0; k < 13; k++) { g.beginPath(); g.moveTo(58, -50); g.quadraticCurveTo(52 + k, -16, 40 + k * 2.4, 12 + (k % 3) * 5); g.stroke(); }
        g.fillStyle = SP.red; g.strokeStyle = SP.line; g.beginPath(); g.arc(58, -52, 8, 0, TAU); g.fill(); g.stroke();
      },
    });
    H.uleg = leather([-20, -14, 20, 90], g => smooth(g, [[-19, -12], [19, -12], [15, 30], [9, 86], [-9, 86], [-14, 30]]), { dye: SP.red, seed: 53, edge: 7, cuts(g) { cut.curl(g, 0, 22, 8, 1, 2); cut.dots(g, [[0, 56]], 2.4); } });
    H.lleg = leather([-14, -6, 18, 98], g => poly(g, [[-7, -2], [7, -2], [7, 66], [10, 76], [13, 96], [-11, 96], [-9, 76], [-7, 66]]), { dye: SP.red, seed: 54, edge: 5, paint(g) { g.fillStyle = SP.black; g.fillRect(-14, 80, 30, 20); }, cuts(g) { cut.dots(g, [[0, 26], [0, 46]], 2.2); } });
    H.tail = leather([-140, -20, 10, 180], g => smooth(g, [[0, -8], [8, 10], [-24, 60], [-36, 120], [-60, 176], [-96, 160], [-118, 112], [-74, 70], [-38, 20], [-10, -10]]), {
      dye: SP.black, seed: 55, edge: 5, cuts(g) { for (let k = 0; k < 9; k++) { g.lineWidth = 2.2; g.beginPath(); g.moveTo(-8 - k * 3, 10 + k * 4); g.quadraticCurveTo(-30 - k * 6, 70, -50 - k * 6, 150 - k * 4); g.stroke(); } },
    });
    return H;
  }

  function makeTitlePlate() {
    const w = 760, h = 300;
    const shape = g => {
      const N = 14;
      g.moveTo(-w / 2, -h / 2 + 30);
      for (let i = 0; i < N; i++) { const x0 = -w / 2 + i * w / N; g.quadraticCurveTo(x0 + w / N / 2, -h / 2 - 12, x0 + w / N, -h / 2 + (i === N - 1 ? 30 : 0)); }
      g.lineTo(w / 2, h / 2 - 30);
      for (let i = 0; i < N; i++) { const x0 = w / 2 - i * w / N; g.quadraticCurveTo(x0 - w / N / 2, h / 2 + 12, x0 - w / N, h / 2 - (i === N - 1 ? 30 : 0)); }
      g.closePath();
    };
    return leather([-w / 2 - 10, -h / 2 - 20, w / 2 + 10, h / 2 + 20], shape, {
      dye: SP.red, seed: 77, edge: 16,
      paint(g) { g.fillStyle = SP.yellow; g.fillRect(-w / 2, -h / 2 - 20, w, 40); g.fillRect(-w / 2, h / 2 - 20, w, 40); },
      cuts(g) {
        cut.meander(g, -w / 2 + 24, -h / 2 + 6, w / 2 - 20, 22, 2.6);
        cut.meander(g, -w / 2 + 24, h / 2 - 6, w / 2 - 20, 22, 2.6);
        [[-w / 2 + 44, 0], [w / 2 - 44, 0]].forEach(([x, y]) => { cut.flower(g, x, y, 22, 8); cut.ring(g, x, y, 31, 2.4); });
        g.font = '400 186px "Ma Shan Zheng"'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('皮影戏', 0, 10);
      },
      lines(g) { g.lineWidth = 3; g.strokeRect(-w / 2 + 84, -h / 2 + 30, w - 168, h - 60); },
    });
  }

  function makeScenery() {
    const tufts = [[-150, -300, 84], [40, -404, 100], [-70, -470, 72], [160, -318, 80], [-20, -292, 70], [90, -250, 60]];
    const trunk = [[-18, 20], [-22, -80], [-6, -170], [-24, -250], [-4, -330], [10, -400], [24, -330], [12, -250], [26, -170], [16, -80], [22, 20]];
    const pine = leather([-240, -540, 260, 30], g => {
      poly(g, trunk); poly(g, [[-14, -200], [-100, -262], [-92, -276], [-4, -226]]); poly(g, [[14, -270], [120, -300], [124, -288], [20, -250]]);
      tufts.forEach(([x, y, r]) => { g.moveTo(x - r, y + r * 0.12); for (let i = 0; i <= 12; i++) { const a = PI + i / 12 * PI; g.lineTo(x + Math.cos(a) * r * (i % 2 ? 1 : 0.86), y + Math.sin(a) * r * 0.62 * (i % 2 ? 1 : 0.86)); } g.quadraticCurveTo(x, y + r * 0.34, x - r, y + r * 0.12); g.closePath(); });
    }, {
      dye: SP.green, seed: 61, edge: 10, union: true,
      paint(g) { g.fillStyle = SP.hide; g.beginPath(); poly(g, trunk); poly(g, [[-14, -200], [-100, -262], [-92, -276], [-4, -226]]); poly(g, [[14, -270], [120, -300], [124, -288], [20, -250]]); g.fill(); },
      cuts(g) {
        tufts.forEach(([x, y, R]) => {
          g.lineWidth = 2.2;
          for (let i = 0; i < 15; i++) { const a = PI * 1.04 + i / 14 * PI * 0.92; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.18, y + 6 + Math.sin(a) * R * 0.1); g.lineTo(x + Math.cos(a) * R * 0.8, y + 6 + Math.sin(a) * R * 0.5); g.stroke(); }
          g.beginPath(); g.arc(x, y + 8, R * 0.12, 0, TAU); g.fill();
        });
        [[0, -40, 9, 1], [-6, -120, 8, -1], [6, -200, 8, 1], [-4, -290, 7, -1], [10, -360, 6, 1]].forEach(([x, y, r, d]) => cut.curl(g, x, y, r, d, 2));
      },
    });
    const rock = leather([-260, -200, 260, 20], g => smooth(g, [[-250, 10], [-230, -90], [-160, -150], [-90, -130], [-40, -196], [40, -170], [90, -110], [170, -130], [240, -60], [250, 10]]), {
      dye: SP.blue, seed: 62, edge: 12,
      cuts(g) { [[-160, -70, 26, 1], [-40, -120, 30, -1], [60, -70, 24, 1], [160, -60, 18, -1], [-90, -20, 18, 1]].forEach(([x, y, R, d]) => { cut.curl(g, x, y, R, d, 2.6); cut.ring(g, x, y, R + 8, 1.6); }); cut.dots(g, [[-200, -30], [0, -40], [110, -20], [200, -20], [-120, -100], [20, -150]], 4); },
    });
    const heads = [[-70, 0, 44, 1], [6, -22, 52, -1], [78, -2, 38, 1]];
    const cloud = leather([-260, -90, 130, 70], g => {
      heads.forEach(([x, y, r]) => ell(g, x, y, r, r * 0.86));
      g.moveTo(-100, 20); g.bezierCurveTo(-140, 44, -190, 40, -214, 22); g.bezierCurveTo(-232, 6, -222, -16, -204, -14); g.bezierCurveTo(-196, 4, -170, 10, -110, -10); g.closePath();
      g.rect(-90, 0, 180, 34);
    }, {
      dye: SP.yellow, seed: 63, edge: 8, union: true,
      cuts(g) { heads.forEach(([x, y, r, d]) => { cut.curl(g, x, y, r * 0.66, d, 2.8); cut.ring(g, x, y, r * 0.86, 1.8); }); cut.curl(g, -206, 4, 9, -1, 2); },
    });
    return { pine, rock, cloud };
  }

  /* --- poses --- */
  const PO = {
    ride:   { torso: 0.06, head: 0.02, low: 0, aF: [-0.95, -0.55, 0.2], aB: [-0.2, -0.9, 0], lF: [-1.3, 1.45], lB: [-1.1, 1.3], wp: -1.15 },
    tuck:   { torso: 0.35, head: 0.25, low: 0, aF: [-1.5, -1.4, 0], aB: [-1.2, -1.2, 0], lF: [-2.0, 2.5], lB: [-1.8, 2.4], wp: -1.3 },
    land:   { torso: 0.32, head: -0.1, low: 0.05, aF: [-0.8, -0.9, 0.2], aB: [0.7, -0.4, 0], lF: [-0.95, 1.35], lB: [0.55, 0.75], wp: -0.25 },
    guard:  { torso: 0.08, head: 0, low: 0, aF: [-0.7, -0.85, 0.2], aB: [0.9, -0.7, 0], lF: [-0.45, 0.4], lB: [0.38, 0.12], wp: -0.42 },
    raise:  { torso: -0.14, head: -0.08, low: 0, aF: [-2.7, -0.35, 0], aB: [0.6, -0.4, 0], lF: [-0.5, 0.35], lB: [0.5, 0.15], wp: -2.5 },
    strike: { torso: 0.3, head: 0.06, low: 0.06, aF: [-1.1, -0.15, 0], aB: [1.2, -0.3, 0], lF: [-0.95, 0.75], lB: [0.75, 0.1], wp: 0.38 },
    pose:   { torso: -0.06, head: -0.14, low: 0, aF: [-1.5, -0.75, 0.1], aB: [1.9, -1.5, 0], lF: [-0.6, 0.55], lB: [0.45, 0.02], wp: -1.62 },
    // opponent
    oGuard: { torso: 0.1, head: 0.02, low: 0, aF: [-0.9, -0.6, 0.1], aB: [0.7, -0.8, 0], lF: [-0.5, 0.45], lB: [0.42, 0.1], wp: -0.2 },
    oThrust:{ torso: 0.28, head: 0.05, low: 0.04, aF: [-1.35, -0.1, 0], aB: [1.1, -0.3, 0], lF: [-0.9, 0.7], lB: [0.7, 0.1], wp: 0.06 },
    oParry: { torso: -0.12, head: -0.1, low: 0, aF: [-1.9, -0.6, 0], aB: [0.6, -0.9, 0], lF: [-0.3, 0.3], lB: [0.5, 0.2], wp: -1.1 },
    oHit:   { torso: -0.5, head: -0.4, low: -0.1, aF: [-2.6, -0.4, 0], aB: [-2.2, -0.6, 0], lF: [-1.2, 1.6], lB: [-0.4, 1.3], wp: -2.4 },
  };
  const mixP = (a, b, k) => {
    const o = {};
    for (const key in a) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k);
    return o;
  };
  // waist height above the feet for a standing pose (so feet stay planted)
  const legDrop = p => Math.max(...[p.lF, p.lB].map(([h, k]) => 40 * Math.cos(p.low) + 92 * Math.cos(h + p.low) + 126 * Math.cos(h + k + p.low)));

  function drawGeneral(g, P, o, rods) {
    const p = o.pose;
    g.save();
    g.translate(o.x, o.y); g.scale(o.s * o.dir, o.s); g.rotate(o.rot || 0);
    const arm = (sx, sy, a, front) => {
      g.save(); g.translate(sx, sy); g.rotate(a[0]); spr(g, P.uarm);
      g.translate(0, 72); g.rotate(a[1]); spr(g, P.farm);
      g.translate(0, 68); g.rotate(a[2]);
      if (front) {
        g.save(); g.translate(2, 14); g.rotate(p.wp - (p.torso + a[0] + a[1] + a[2]) + (o.wpSpin || 0)); spr(g, P.weapon);
        if (rods) rods.tip = tpt(g, P === null ? 0 : 300, 0);
        g.restore();
      }
      spr(g, P.hand);
      if (rods) rods[front ? 'hF' : 'hB'] = tpt(g, 2, 16);
      g.restore();
    };
    const leg = (hx, hy, l) => { g.save(); g.translate(hx, hy); g.rotate(l[0]); spr(g, P.thigh); g.translate(0, 92); g.rotate(l[1]); spr(g, P.shin); g.restore(); };
    // lower body (behind the torso)
    g.save(); g.rotate(p.low);
    if (!o.mounted) leg(-14, 40, p.lB);
    spr(g, P.lower);
    leg(12, 40, p.lF);
    g.restore();
    g.save(); g.rotate(p.torso);
    g.save(); g.translate(-26, -128); g.rotate(o.flagSway || 0); spr(g, P.flags); g.restore();
    arm(-22, -128, p.aB, false);
    spr(g, P.torso);
    g.save(); g.translate(4, -150); g.rotate(p.head); spr(g, P.head); if (rods) rods.neck = tpt(g, -4, -6); g.restore();
    arm(24, -126, p.aF, true);
    g.restore();
    g.restore();
  }

  // horse pose → draws, returns saddle-space transform for the rider
  function drawHorse(g, H, o, rods) {
    g.save();
    g.translate(o.x, o.y); g.scale(o.s, o.s);
    g.translate(-110, 200); g.rotate(o.rear || 0); g.translate(110, -200);   // rear up about the hind hooves
    g.rotate(o.pitch || 0);
    const L = o.legs;
    const leg = (x, y, a, b, dark) => { g.save(); g.translate(x, y); g.rotate(a); spr(g, H.uleg); g.translate(0, 84); g.rotate(b); spr(g, H.lleg); g.restore(); };
    g.save(); g.translate(-166, -26); g.rotate(o.tail || 0); spr(g, H.tail); g.restore();
    leg(96, 28, L[2], L[3]); leg(-104, 22, L[6], L[7]);
    spr(g, H.body);
    leg(118, 30, L[0], L[1]); leg(-124, 26, L[4], L[5]);
    g.save(); g.translate(112, -38); g.rotate(o.neck || 0); spr(g, H.neck); g.restore();
    if (rods) rods.horse = tpt(g, -40, -10);
    const saddle = tpt(g, -14, -76), up = tpt(g, -14, -176);
    g.restore();
    return { saddle, ang: Math.atan2(up[0] - saddle[0], saddle[1] - up[1]) };
  }

  // gallop: phase in cycles, amplitude 0..1
  function gallop(ph, amp) {
    const a = ph * TAU;
    return [
      0.55 * Math.sin(a) * amp, (0.25 + 0.75 * Math.max(0, Math.sin(a + 1.4))) * 1.3 * amp,
      0.55 * Math.sin(a - 0.5) * amp, (0.25 + 0.75 * Math.max(0, Math.sin(a + 0.9))) * 1.3 * amp,
      -0.5 * Math.sin(a + 2.4) * amp, -(0.2 + 0.6 * Math.max(0, Math.sin(a + 3.6))) * amp,
      -0.5 * Math.sin(a + 1.9) * amp, -(0.2 + 0.6 * Math.max(0, Math.sin(a + 3.1))) * amp,
    ];
  }

  // pure function of time: positions & poses of everything on the screen
  function spState(t) {
    const S = {};
    // horse: gallop in, rear, run off
    const hx = t < 3.66 ? kf(t, [[0.3, 40], [2.95, 700, E.outC], [3.4, 740, E.ioS]]) : kf(t, [[3.66, 740], [3.8, 790, E.inQ], [4.7, 2400, E.lin]]);
    const hv = (t < 3.66 ? (kf(t + 0.02, [[0.3, 40], [2.95, 700, E.outC], [3.4, 740, E.ioS]]) - hx) : 40) / 0.02;
    const amp = clamp(Math.abs(hv) / 500, 0.35, 1) * (t > 2.95 && t < 3.85 ? 0.25 : 1);
    const ph = t * 2.4;
    const rear = kf(t, [[2.95, 0], [3.3, -0.4, E.outC], [3.62, -0.34], [3.98, 0, E.ioS]]);
    let legs = gallop(ph, amp);
    const rk = clamp(-rear / 0.4);
    if (rk > 0) legs = legs.map((v, i) => lerp(v, [-1.0, 1.6, -0.75, 1.4, 0.15, -0.1, 0.25, -0.15][i], rk));
    S.horse = { x: hx, y: BASE - 214 * 1.15 - Math.abs(Math.sin(ph * PI)) * 10 * amp, s: 1.15, rear, pitch: 0.035 * Math.sin(ph * TAU) * amp, legs,
      neck: -0.08 * Math.sin(ph * TAU + 1) * amp - rk * 0.35, tail: 0.25 * Math.sin(ph * TAU) * amp + rk * 0.4 };
    S.horseFocus = 1 - seg(t, 4.3, 5.0);
    // hero
    const h = { dir: 1, s: 1, x: 0, y: 0, rot: 0, mounted: false, pose: PO.guard };
    if (t < 3.62) { h.mounted = true; h.pose = mixP(PO.ride, PO.raise, bump(t, 3.0, 0.35, 0.1, 0.25) * 0.55); }
    else if (t < 4.6) {
      const u = seg(t, 3.62, 4.6);
      h.pose = mixP(PO.tuck, PO.land, E.inQ(seg(u, 0.75, 1)));
      if (u < 0.2) h.pose = mixP(PO.ride, PO.tuck, E.outQ(u / 0.2));
    } else if (t < 5.0) h.pose = mixP(PO.land, PO.guard, E.ioS(seg(t, 4.6, 5.0)));
    else if (t < 6.85) {
      // three exchanges — clash moments at 5.75, 6.2, 6.6
      const k1 = bump(t, 5.45, 0.3, 0.05, 0.12), k2 = bump(t, 5.95, 0.25, 0.04, 0.12), k3 = bump(t, 6.38, 0.22, 0.04, 0.2);
      const w1 = bump(t, 5.15, 0.3, 0, 0.3), w2 = bump(t, 5.82, 0.13, 0, 0.12), w3 = bump(t, 6.26, 0.12, 0, 0.12);
      h.pose = mixP(mixP(PO.guard, PO.raise, Math.max(w1, w2, w3)), PO.strike, Math.max(k1, k2, k3));
    } else if (t < 7.6) {
      const sp = E.ioS(seg(t, 6.85, 7.22));
      h.pose = mixP(mixP(PO.guard, PO.raise, bump(t, 6.8, 0.2, 0.05, 0.14)), PO.strike, E.outQ(seg(t, 7.12, 7.26)) * (1 - E.ioS(seg(t, 7.4, 7.6)) * 0.4));
      h.wpSpin = sp * TAU;
    } else h.pose = mixP(mixP(PO.strike, PO.guard, 0.4), PO.pose, E.outB(seg(t, 7.6, 8.25), 1.2));
    const stand = p => BASE - legDrop(p);
    if (h.mounted) {
      // rider follows the saddle (computed by a dry horse pass in draw); placeholder
      h.followSaddle = true;
    } else if (t < 4.6) {
      const u = seg(t, 3.62, 4.6);
      h.leap = u;
    } else {
      const x0 = 900;
      const lunge = 100 * (bump(t, 5.45, 0.3, 0.05, 0.12) + bump(t, 5.95, 0.25, 0.04, 0.12) + bump(t, 6.38, 0.22, 0.04, 0.2)) + 90 * bump(t, 7.1, 0.16, 0.2, 0.4);
      h.x = lerp(x0, 640, E.ioS(seg(t, 7.55, 8.3))) + lunge * (1 - seg(t, 7.55, 8.0));
      const dip = 36 * (1 - spring(t - 4.6, 2.4, 0.45)) * (t > 4.6 ? 1 : 0);
      h.y = stand(h.pose) + dip * (1 - seg(t, 4.9, 5.2)) - (t > 7.55 && t < 8.3 ? 22 * Math.abs(Math.sin((t - 7.55) / 0.75 * PI * 3)) : 0);
    }
    h.flagSway = 0.06 * Math.sin(t * 5.1) + (h.mounted ? 0.06 * Math.sin(ph * TAU) * amp : 0);
    S.hero = h;
    // opponent
    const o = { dir: -1, s: 1, mounted: false, pose: PO.oGuard, rot: 0 };
    o.x = kf(t, [[4.75, 2150], [5.45, 1570, E.outC]]) - 100 * (bump(t, 5.5, 0.22, 0.05, 0.15) + bump(t, 5.98, 0.2, 0.04, 0.15)) + 60 * bump(t, 6.4, 0.2, 0.04, 0.2);
    o.pose = mixP(mixP(PO.oGuard, PO.oThrust, bump(t, 5.5, 0.22, 0.05, 0.15) + bump(t, 5.98, 0.2, 0.04, 0.15)), PO.oParry, bump(t, 6.38, 0.2, 0.06, 0.2) + bump(t, 6.9, 0.25, 0.1, 0.1));
    o.y = BASE - legDrop(o.pose);
    o.focus = seg(t, 4.75, 5.35);
    const hit = seg(t, 7.24, 8.1);
    if (hit > 0) {
      o.pose = mixP(o.pose, PO.oHit, E.outQ(seg(hit, 0, 0.25)));
      o.x += 520 * E.outQ(hit); o.y -= 300 * Math.sin(PI * Math.min(1, hit * 0.8)) + 40 * hit; o.rot = -TAU * 1.1 * E.outQ(hit);
      o.focus = 1 - E.inQ(hit);
    }
    o.alpha = hit > 0 ? 1 - E.inQ(hit) : 0.3 + 0.7 * o.focus;
    S.opp = o;
    S.title = E.outC(seg(t, 8.1, 8.8));
    return S;
  }

  function spComposite(c, layer, blur, alpha, sat = 1, scale = 1, cx = 960, cy = 540) {
    c.save();
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = alpha;
    c.filter = blur > 0.3 || sat < 1 ? `blur(${blur.toFixed(1)}px) saturate(${sat.toFixed(2)})` : 'none';
    if (scale !== 1) { c.translate(cx, cy); c.scale(scale, scale); c.translate(-cx, -cy); }
    c.drawImage(layer, 0, 0, 1920, 1080);
    c.restore();
  }

  function drawRods(g, rods, list, t) {
    g.lineCap = 'round';
    list.forEach(([key, dx, w]) => {
      const p = rods[key]; if (!p) return;
      const ex = p[0] + dx, ey = 1220;
      g.strokeStyle = 'rgba(28,12,4,0.82)';
      g.lineWidth = w; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = 'rgba(28,12,4,0.9)'; g.beginPath(); g.arc(p[0], p[1], w * 0.9, 0, TAU); g.fill();
    });
  }

  MG.film({
    id: 'shadowpuppet', dur: 10, poster: 9.4,
    fonts: [['400 80px "Ma Shan Zheng"', '皮影戏'], ['500 40px "Cormorant SC"', 'SHADOW PUPPETRY PIYING LEATHER LAMP SCREEN'], ['italic 500 30px "Cormorant Garamond"', 'dyed leather, oil lamp, cloth screen']],
    meta: {
      family: 'I', name: 'Shadow Puppetry', sub: 'Piying 皮影戏', era: 'Han dynasty —',
      origin: 'Chinese shadow play presses jointed puppets of scraped, dyed and hollow-carved donkey or cow hide against a backlit cloth screen, worked on rods while a band of suona, banhu, gongs and cymbals plays. Shaanxi and Tangshan are its best-known schools, and it was inscribed on UNESCO’s Intangible Cultural Heritage list in 2011.',
      works: 'To Live (Zhang Yimou, 1994) · The Pig Eats Watermelon (Wan Guchan, 1958) · Huaxian Shadow Play troupes, Shaanxi · Tangshan shadow play · UNESCO Intangible Cultural Heritage (2011)',
      tech: ['Translucent dyed hide', 'Hollow-carved patterns', 'Rod-driven joints on a lamp-lit screen'],
      accent: '#d63b28',
      motionDNA: 'Stiff jointed limbs that swing like pendulums from three rods, a body that glides on the main rod, and sudden flourishes such as the somersault and the frozen pose on a gong crash.',
      visualDNA: 'Profile figures in translucent red, green and yellow hide carved into lace, glowing through a warm lamp-lit cloth with a soft halo where they touch it and blurred rods below.',
      transitions: 'Blur-to-sharp press onto the screen, lift-off into soft shadow, lamp flare, gong-crash freeze',
      implementation: ['Physical puppets + lamp', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080;
      const r = rng(2011);
      // cloth screen 亮子 lit from behind
      const screen = offscreen(W, H), g = screen.getContext('2d');
      const gr = g.createRadialGradient(940, 500, 30, 960, 520, 1080);
      gr.addColorStop(0, '#fff5d6'); gr.addColorStop(0.22, '#fde2a6'); gr.addColorStop(0.5, '#eba65a'); gr.addColorStop(0.78, '#b0581f'); gr.addColorStop(1, '#5a240a');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const wv = offscreen(96, 96), wg = wv.getContext('2d');
      for (let y = 0; y < 96; y += 3) { wg.fillStyle = `rgba(90,50,10,${0.05 + r() * 0.05})`; wg.fillRect(0, y, 96, 1); }
      for (let x = 0; x < 96; x += 3) { wg.fillStyle = `rgba(90,50,10,${0.04 + r() * 0.05})`; wg.fillRect(x, 0, 1, 96); }
      g.fillStyle = g.createPattern(wv, 'repeat'); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {   // water stains and scorch from years of lamps
        const x = r() * W, y = r() * H, rr = 60 + r() * 220, sg = g.createRadialGradient(x, y, rr * 0.6, x, y, rr);
        sg.addColorStop(0, 'rgba(160,100,40,0.025)'); sg.addColorStop(0.85, 'rgba(140,80,30,0.06)'); sg.addColorStop(1, 'rgba(140,80,30,0)');
        g.fillStyle = sg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      g.strokeStyle = 'rgba(120,70,30,0.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(700, 0); g.lineTo(704, H); g.moveTo(1290, 0); g.lineTo(1287, H); g.stroke();
      // wooden stage frame with carved fretwork
      const frame = offscreen(W, H), f = frame.getContext('2d');
      f.fillStyle = '#140904'; f.fillRect(0, 0, W, H);
      for (let i = 0; i < 260; i++) { f.strokeStyle = `rgba(${70 + r() * 40},${32 + r() * 20},12,${0.15 + r() * 0.2})`; f.lineWidth = 1 + r() * 2; const y = r() * H; f.beginPath(); f.moveTo(0, y); f.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 20, W * 0.7, y + (r() - 0.5) * 20, W, y + (r() - 0.5) * 10); f.stroke(); }
      f.globalCompositeOperation = 'destination-out'; f.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); f.globalCompositeOperation = 'source-over';
      f.strokeStyle = '#6b1d10'; f.lineWidth = 10; f.strokeRect(SCR.x - 9, SCR.y - 9, SCR.w + 18, SCR.h + 18);
      f.strokeStyle = 'rgba(214,160,70,0.75)'; f.lineWidth = 2; f.strokeRect(SCR.x - 16, SCR.y - 16, SCR.w + 32, SCR.h + 32);
      f.strokeStyle = 'rgba(214,160,70,0.5)'; f.lineWidth = 1.5; f.strokeRect(SCR.x - 4, SCR.y - 4, SCR.w + 8, SCR.h + 8);
      // fretwork on the lower ledge
      f.strokeStyle = 'rgba(200,140,60,0.55)'; f.lineWidth = 3; f.beginPath();
      for (let x = SCR.x + 10, s = 34; x + s < SCR.x + SCR.w; x += s) { const y = 1012; f.moveTo(x, y + 14); f.lineTo(x, y - 12); f.lineTo(x + s * 0.72, y - 12); f.lineTo(x + s * 0.72, y + 6); f.lineTo(x + s * 0.32, y + 6); f.lineTo(x + s * 0.32, y - 3); }
      f.stroke();
      [[SCR.x - 16, SCR.y - 16], [SCR.x + SCR.w + 16, SCR.y - 16], [SCR.x - 16, SCR.y + SCR.h + 16], [SCR.x + SCR.w + 16, SCR.y + SCR.h + 16]].forEach(([x, y]) => { f.fillStyle = '#b98a3e'; f.beginPath(); f.arc(x, y, 7, 0, TAU); f.fill(); });
      // scenery pressed on the screen, pre-composited
      const sc = makeScenery(), scene = offscreen(W, H), s2 = scene.getContext('2d');
      s2.save(); s2.translate(250, BASE + 16); spr(s2, sc.pine); s2.restore();
      s2.save(); s2.translate(230, BASE + 14); s2.scale(1.1, 0.9); spr(s2, sc.rock); s2.restore();
      s2.save(); s2.translate(1640, BASE + 16); s2.scale(-0.75, 0.6); spr(s2, sc.rock); s2.restore();
      s2.save(); s2.translate(1560, 170); s2.scale(0.9, 0.9); spr(s2, sc.cloud); s2.restore();
      s2.save(); s2.translate(560, 140); s2.scale(-0.7, 0.7); spr(s2, sc.cloud); s2.restore();
      return {
        screen, frame, scene, hero: makeGeneral('hero'), opp: makeGeneral('opp'), horse: makeHorse(), plate: makeTitlePlate(),
        L: offscreen(W, H), B: offscreen(W, H), B2: offscreen(W, H), R: offscreen(W, H), G: offscreen(W, H),
      };
    },
    draw(c, t, W, H, st) {
      const S = spState(t);
      // lamp: ignition then a living oil flame
      const lit = t < 0.25 ? 0 : kf(t, [[0.25, 0.15], [0.32, 0.55, E.outQ], [0.42, 0.3], [0.9, 1, E.outC]]);
      const flick = 1 + 0.045 * vnoise(t * 9, 3) + 0.025 * vnoise(t * 23, 5) + 0.12 * bump(t, 7.24, 0.04, 0.05, 0.4) + 0.06 * (bump(t, 5.75, 0.03, 0, 0.2) + bump(t, 6.2, 0.03, 0, 0.2) + bump(t, 6.6, 0.03, 0, 0.2));
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save();
      c.beginPath(); c.rect(SCR.x, SCR.y, SCR.w, SCR.h); c.clip();
      c.drawImage(st.screen, 0, 0);
      c.globalCompositeOperation = 'multiply';
      c.filter = 'blur(2.5px)'; c.globalAlpha = 0.5; c.drawImage(st.scene, 4, 3); c.filter = 'none'; c.globalAlpha = 1;
      c.drawImage(st.scene, 0, 0);
      c.globalCompositeOperation = 'source-over';
      // ----- puppets -----
      const L = st.L.getContext('2d'), B = st.B.getContext('2d'), B2 = st.B2.getContext('2d'), R = st.R.getContext('2d');
      [L, B, B2, R].forEach(g => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'multiply'; });
      const rods = {}, ro = {};
      // horse + hero (hero follows the saddle while mounted)
      const hf = clamp(seg(t, 0.4, 1.5));
      const horseOn = S.horse.x < 2300;
      let sad = null;
      if (horseOn) {
        const hg = hf < 1 || S.horseFocus < 1 ? B : L;
        sad = drawHorse(hg, st.horse, S.horse, rods);
      }
      const h = S.hero;
      if (h.mounted && sad) { h.x = sad.saddle[0] + 4; h.y = sad.saddle[1] - 28; h.rot = sad.ang * 0.8; }
      if (h.leap !== undefined) {
        // take-off from the saddle at 3.62 (re-derive it from a dry pass)
        const S0 = spState(3.619), dry = drawHorse(R, st.horse, S0.horse, null); R.setTransform(1, 0, 0, 1, 0, 0); R.clearRect(0, 0, W, H);
        const x0 = dry.saddle[0] + 4, y0 = dry.saddle[1] - 28, u = h.leap;
        h.x = lerp(x0, 900, E.ioS(u)); h.y = lerp(y0, BASE - legDrop(PO.land) + 36, u) - 280 * Math.sin(PI * u);
        h.rot = TAU * E.ioC(seg(u, 0.08, 0.92));
      }
      drawGeneral(hf < 1 ? B : L, st.hero, h, ro);
      // opponent
      const o = S.opp;
      if (o.x < 2300 && t > 4.7 && t < 8.1) drawGeneral(o.focus < 1 ? B2 : L, st.opp, o, rods.o = {});
      // rods (behind the screen, so their shadows sit soft)
      drawRods(R, ro, [['neck', -90, 5], ['hF', 70, 4], ['hB', -40, 4]], t);
      if (horseOn && S.horse.x > -300) drawRods(R, rods, [['horse', -60, 6]], t);
      if (rods.o && o.focus > 0.6) drawRods(R, rods.o, [['neck', 90, 5], ['hF', -60, 4], ['hB', 40, 4]], t);
      // title plate
      if (S.title > 0) {
        const tg = S.title < 1 ? B2 : L;
        tg.save(); tg.translate(1268, 470); spr(tg, st.plate); if (S.title >= 1) { tg.globalCompositeOperation = 'multiply'; } tg.restore();
        R.strokeStyle = 'rgba(28,12,4,0.8)'; R.lineWidth = 5; R.beginPath(); R.moveTo(1268, 600); R.lineTo(1300, 1200); R.stroke();
      }
      // composite: rods, unfocused shadows, then the pressed puppets with a soft penumbra
      spComposite(c, st.R, 2, 0.85 * clamp(lit * 1.2));
      if (hf < 1 || S.horseFocus < 1) {
        const k = Math.min(hf, horseOn ? S.horseFocus : 1);
        spComposite(c, st.B, (1 - k) * 34, 0.35 + 0.65 * k, 0.15 + 0.85 * k, 1 + (1 - k) * 0.3, S.horse.x, 700);
      }
      if (t > 4.7 && (o.focus < 1 || S.title < 1)) {
        if (o.focus < 1 && t < 8.1) spComposite(c, st.B2, (1 - o.focus) * 34, o.alpha, 0.15 + 0.85 * o.focus, 1 + (1 - o.focus) * 0.3, o.x, 560);
        else if (S.title > 0) spComposite(c, st.B2, (1 - S.title) * 30, 0.3 + 0.7 * S.title, 0.2 + 0.8 * S.title, 1 + (1 - S.title) * 0.25, 1268, 470);
      }
      if (o.focus < 1 && S.title > 0 && S.title < 1) { /* both on B2 — composited together above */ }
      // halo: lamp light blooming around the hide where it is pressed to the cloth
      const G = st.G.getContext('2d');
      G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; G.clearRect(0, 0, W, H);
      G.drawImage(st.L, 0, 0); G.globalCompositeOperation = 'source-in'; G.fillStyle = '#ffcf7a'; G.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.5 * lit; c.filter = 'blur(22px)'; c.drawImage(st.G, 0, 0, W, H); c.restore();
      spComposite(c, st.L, 7, 0.45);
      spComposite(c, st.L, 0, 1);
      // subtitle under the plate, printed on the screen
      if (t > 8.2) {
        const a = E.outC(seg(t, 8.7, 9.25));
        c.globalAlpha = a;
        text(c, 'SHADOW PUPPETRY  ·  PIYING', 1268, 680, { font: '"Cormorant SC"', weight: 700, size: 40, align: 'center', ls: 9, color: 'rgba(60,24,8,0.85)' });
        text(c, 'dyed hide, carved & lit by an oil lamp', 1268, 726, { font: '"Cormorant Garamond"', style: 'italic', weight: 500, size: 30, align: 'center', color: 'rgba(90,40,14,0.7)' });
        c.globalAlpha = 1;
      }
      // lamp flicker & hotspot
      const lampX = 940 + vnoise(t * 2, 9) * 30, lampY = 520 + vnoise(t * 2.3, 10) * 16;
      const hs = c.createRadialGradient(lampX, lampY, 0, lampX, lampY, 760);
      hs.addColorStop(0, `rgba(255,214,140,${0.22 * flick * lit})`); hs.addColorStop(1, 'rgba(255,170,80,0)');
      c.globalCompositeOperation = 'screen'; c.fillStyle = hs; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const dark = clamp(1 - lit * flick, 0, 1);
      c.fillStyle = `rgba(8,3,0,${dark * 0.97 + Math.max(0, 1 - flick) * 0.6})`; c.fillRect(0, 0, W, H);
      if (flick > 1.03) { c.fillStyle = `rgba(255,236,190,${(flick - 1.03) * 0.8})`; c.globalCompositeOperation = 'screen'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
      vignette(c, W, H, 0.55, '40,14,0');
      c.restore();
      // frame
      c.drawImage(st.frame, 0, 0);
      c.fillStyle = `rgba(0,0,0,${0.5 * (1 - lit)})`; c.fillRect(0, 0, W, H);
      // warm spill on the frame edges
      const sp = c.createLinearGradient(0, SCR.y + SCR.h, 0, H);
      sp.addColorStop(0, `rgba(255,170,70,${0.12 * lit})`); sp.addColorStop(0.3, 'rgba(255,170,70,0)');
      c.fillStyle = sp; c.fillRect(0, SCR.y + SCR.h, W, H);
      grain(c, W, H, t, 0.12, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.95;
      // ---- instruments ----
      const bigGong = (t, g = 0.5) => {   // 大锣: pitch falls after the strike
        [1, 1.48, 2.11, 2.6, 3.3].forEach((r, i) => A.osc(t, { f: 210 * r, f2: 210 * r * 0.88, glide: 1.4, dur: 2.6 / (1 + i * 0.4), g: g * 0.22 / (1 + i * 0.6), a: 0.004, rev: 0.5, pan: (i % 2 ? 0.15 : -0.15) }));
        A.noise(t, { type: 'bandpass', f: 600, q: 0.8, dur: 0.5, g: g * 0.25, rev: 0.4 });
      };
      const xiaoluo = (t, g = 0.3) => {   // 小锣: pitch rises
        A.osc(t, { f: 820, f2: 980, glide: 0.25, dur: 0.9, g: g * 0.28, rev: 0.35, pan: 0.25 });
        A.osc(t, { f: 1840, f2: 2150, glide: 0.25, dur: 0.4, g: g * 0.08, rev: 0.3, pan: 0.25 });
        A.noise(t, { type: 'bandpass', f: 2600, q: 2, dur: 0.06, g: g * 0.25, pan: 0.25 });
      };
      const cymbal = (t, g = 0.3, long = 0.5) => {   // 铙钹
        A.noise(t, { type: 'highpass', f: 3800, dur: long, g: g * 0.5, rev: 0.35, pan: -0.25 });
        A.noise(t, { type: 'bandpass', f: 6500, q: 1.5, dur: long * 0.7, g: g * 0.35, pan: -0.2 });
        [3170, 4730, 5910].forEach(f => A.osc(t, { f, dur: long * 0.5, g: g * 0.025, pan: -0.25 }));
      };
      const cang = (t, g = 0.5) => { bigGong(t, g); cymbal(t, g * 0.8); xiaoluo(t, g * 0.6); };
      const cai = (t, g = 0.4) => { cymbal(t, g * 0.7, 0.25); xiaoluo(t, g * 0.5); };
      const bangu = (t, g = 0.3) => { A.noise(t, { type: 'bandpass', f: 2400, q: 5, dur: 0.035, g }); A.osc(t, { type: 'triangle', f: 980, dur: 0.03, g: g * 0.4 }); };
      const bangzi = (t, g = 0.3) => { A.osc(t, { type: 'triangle', f: 1560, dur: 0.05, g: g * 0.5, rev: 0.2 }); A.noise(t, { type: 'bandpass', f: 2300, q: 9, dur: 0.05, g: g * 0.6 }); };
      const tanggu = (t, g = 0.4) => { A.osc(t, { f: 120, f2: 70, glide: 0.2, dur: 0.45, g }); A.noise(t, { type: 'lowpass', f: 500, dur: 0.1, g: g * 0.4 }); };
      const suona = (t, m, d, o = {}) => {
        const f = midi(m);
        A.osc(t, { type: 'sawtooth', f: f * (o.from || 0.94), f2: f, glide: o.glide ?? 0.06, dur: d, g: o.g ?? 0.07, a: 0.02, hold: true, rel: 0.08, lp: 2800, q: 5, vib: [6.2, f * 0.012], rev: 0.35, pan: 0.1 });
        A.osc(t, { type: 'square', f: f * (o.from || 0.94), f2: f, glide: o.glide ?? 0.06, dur: d, g: (o.g ?? 0.07) * 0.35, a: 0.02, hold: true, rel: 0.08, lp: 1600, q: 3, vib: [6.2, f * 0.012], rev: 0.3, pan: 0.1 });
      };
      const banhu = (t, m, d, g = 0.04) => { const f = midi(m); A.osc(t, { type: 'sawtooth', f: f * 1.03, f2: f, glide: 0.08, dur: d, g, a: 0.03, hold: true, rel: 0.1, lp: 3800, q: 2, vib: [6.8, f * 0.016], rev: 0.4, pan: -0.3 }); };
      // ---- cue sheet ----
      A.noise(0.0, { type: 'lowpass', f: 300, dur: 9.9, g: 0.02, hold: true, rel: 0.5 });           // lamp room tone
      A.noise(0.22, { type: 'bandpass', f: 900, f2: 300, sweep: 0.3, dur: 0.35, g: 0.12 });          // wick catches
      cang(0.3, 0.55);
      for (let i = 0; i < 14; i++) bangu(0.55 + i * 0.075 * (1 - i * 0.025), 0.12 + i * 0.012);  // 急急风 roll
      cai(1.55, 0.35);
      // gallop: bangzi clip-clop on the hooves + small gong offbeats
      for (let k = 0; k < 7; k++) { const tb = 1.2 + k / 2.4; if (tb < 3.0) { bangzi(tb, 0.22); bangzi(tb + 0.09, 0.16); bangzi(tb + 0.2, 0.12); } }
      [1.95, 2.4, 2.85].forEach(tt => xiaoluo(tt, 0.22)); [2.18, 2.63].forEach(tt => cymbal(tt, 0.14, 0.2));
      tanggu(1.55, 0.25); tanggu(2.4, 0.22);
      // suona: the heroic tune (D gong mode)
      [[1.6, 74, 0.28], [1.9, 76, 0.14], [2.05, 78, 0.14], [2.2, 81, 0.42], [2.65, 78, 0.14], [2.8, 81, 0.14], [2.95, 83, 0.3]].forEach(([tt, m, d]) => suona(tt, m, d));
      [[1.6, 62, 0.28], [1.9, 64, 0.14], [2.05, 66, 0.14], [2.2, 69, 0.42], [2.65, 66, 0.28], [2.95, 71, 0.3]].forEach(([tt, m, d]) => banhu(tt, m, d));
      // the horse rears: suona whinny
      suona(3.28, 86, 0.32, { from: 0.8, glide: 0.18, g: 0.08 }); suona(3.6, 81, 0.12, { from: 1.06, g: 0.06 });
      bigGong(3.3, 0.35); cymbal(3.3, 0.25, 0.4);
      // leap: roll accelerates into the landing 仓
      A.whoosh(3.62, 0.9, { f1: 300, f2: 1800, g: 0.3 }); suona(3.7, 81, 0.2, { g: 0.05 }); suona(3.92, 83, 0.2, { g: 0.05 }); suona(4.14, 86, 0.36, { g: 0.055 });
      for (let i = 0; i < 12; i++) bangu(3.66 + i * 0.075, 0.1 + i * 0.015);
      cang(4.6, 0.6); tanggu(4.6, 0.5);
      // the rival steps in
      [4.85, 5.05, 5.2].forEach((tt, i) => tanggu(tt, 0.25 + i * 0.08));
      banhu(4.85, 69, 0.5, 0.045); banhu(5.35, 68, 0.3, 0.04);
      // three clashes: metal on metal + 仓 才 仓
      [5.75, 6.2, 6.6].forEach((tt, i) => {
        A.bell(tt, 1250 + i * 160, { ratios: [1, 2.32, 3.97, 5.6], g: 0.08, dur: 0.6, rev: 0.25 });
        A.noise(tt, { type: 'highpass', f: 5000, dur: 0.12, g: 0.12 });
        i === 1 ? cai(tt, 0.4) : cang(tt, 0.4 + i * 0.05);
      });
      suona(5.75, 81, 0.22, { g: 0.06 }); suona(6.2, 83, 0.22, { g: 0.06 }); suona(6.6, 86, 0.3, { g: 0.065 });
      // weapon flourish → strike
      A.whoosh(6.85, 0.4, { f1: 400, f2: 2600, g: 0.16 }); A.whoosh(7.0, 0.26, { f1: 600, f2: 3200, g: 0.14, pan: 0.3 });
      for (let i = 0; i < 6; i++) bangu(6.9 + i * 0.055, 0.14 + i * 0.02);
      cang(7.24, 0.7); A.impact(7.24, 0.45); cymbal(7.24, 0.3, 1.4);
      suona(7.3, 86, 0.5, { from: 0.86, glide: 0.12, g: 0.07 }); suona(7.82, 83, 0.12, { g: 0.06 });
      // 亮相: 仓 才 仓 才 | 仓 —
      [7.7, 7.92, 8.1, 8.28].forEach((tt, i) => (i % 2 ? cai(tt, 0.32) : cang(tt, 0.38)));
      bangzi(8.52, 0.25);
      cang(8.68, 0.7); tanggu(8.68, 0.4);
      suona(8.0, 78, 0.18, { g: 0.06 }); suona(8.2, 81, 0.4, { g: 0.065 }); suona(8.68, 74, 1.1, { from: 0.92, g: 0.075 });
      banhu(8.68, 62, 1.1, 0.045); banhu(8.68, 69, 1.1, 0.03);
    },
  });

  /* =====================================================================
     02  DUNHUANG 敦煌 — flying apsaras on cracked mineral-pigment plaster
     ===================================================================== */
  const DH = {
    ground: '#8e432d', groundL: '#a95c3b', groundD: '#62291b', plaster: '#c4ad86', plasterD: '#a88e68',
    mal: '#3e8a6c', malL: '#6fae8e', lapis: '#2f5687', lapisL: '#5a7fae', cin: '#b8432c', ochre: '#c99442',
    lead: '#e2d6bb', leadD: '#57493f', skin: '#e6c39c', skinD: '#9a5a3c', ink: '#3e160c', hair: '#2a1a14',
  };
  const DC = { x: 960, y: 530 };   // the lotus mandala & cartouche centre

  // Catmull-Rom through timed keys [[t,x,y],...]; extrapolates linearly outside
  function trail(keys) {
    return t => {
      const n = keys.length;
      if (t <= keys[0][0]) { const a = keys[0], b = keys[1], k = (t - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
      if (t >= keys[n - 1][0]) return [keys[n - 1][1], keys[n - 1][2]];
      let i = 0; while (t > keys[i + 1][0]) i++;
      const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n - 1, i + 2)];
      const u = (t - p1[0]) / (p2[0] - p1[0]), u2 = u * u, u3 = u2 * u;
      const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
    };
  }
  const APS = [
    { dir: 1, s: 1.22, path: trail([[-0.5, 1800, 200], [0.0, 1710, 260], [1.0, 1570, 400], [2.4, 1500, 600], [3.8, 1500, 560], [5.4, 1530, 500], [7.0, 1524, 528], [8.6, 1528, 514]]), ph: 0 },
    { dir: -1, s: 1.22, path: trail([[1.0, -700, 860], [2.0, -300, 740], [3.4, 220, 380], [5.0, 380, 482], [6.6, 396, 534], [8.6, 392, 514]]), ph: 2.1 },
    { dir: -1, s: 0.46, path: trail([[1.5, -400, 200], [6.0, 760, 168], [11.5, 2300, 190]]), ph: 4.2, bg: true },
    { dir: 1, s: 0.42, path: trail([[2.5, 2350, 210], [7.5, 1100, 186], [12.5, -300, 200]]), ph: 5.3, bg: true },
  ];
  function apsX(A, t) {
    const p = A.path(t), q = A.path(t + 0.05), vx = (q[0] - p[0]) / 0.05, vy = (q[1] - p[1]) / 0.05, sp = Math.hypot(vx, vy);
    const head = -A.dir * Math.atan2(vy, Math.abs(vx) + 1e-6);
    const k = clamp(sp / 260);
    const rot = clamp(head * 0.7, -0.45, 0.45) * k + (1 - k) * 0.06 * Math.sin(t * 0.9 + A.ph);
    return { x: p[0], y: p[1] + Math.sin(t * 1.25 + A.ph) * 9 * (1 - k * 0.6), rot, dir: A.dir, s: A.s, sp };
  }
  const toW = (X, lx, ly) => { const c = Math.cos(X.rot), s = Math.sin(X.rot), x = lx * X.dir * X.s, y = ly * X.s; return [X.x + c * x - s * y, X.y + s * x + c * y]; };

  // a mineral-pigment fill with darkened contour shading (晕染) and an iron-wire outline
  function dfill(g, path, col, shade, sw = 9, lw = 2) {
    g.beginPath(); path(g); g.fillStyle = col; g.fill();
    if (shade) { g.save(); g.beginPath(); path(g); g.clip(); g.lineWidth = sw; g.strokeStyle = shade; g.beginPath(); path(g); g.stroke(); g.restore(); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = DH.ink; g.beginPath(); path(g); g.stroke(); }
  }

  // a silk scarf: runs of front/back colour as it twists, iron-wire edges
  function scarf(g, pts, w0, cA, cB, tw0, tws) {
    const N = pts.length, L = [], R = [], side = [];
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const s = i / (N - 1), cw = Math.cos(tw0 + s * tws);
      const taper = Math.min(1, s * 14) * (s > 0.82 ? Math.max(0, (1 - s) / 0.18) : 1);
      const w = w0 * (1 - 0.35 * s) * (0.14 + 0.86 * Math.abs(cw)) * Math.max(0.15, taper) / 2;
      L.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); R.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]); side.push(cw >= 0);
    }
    let i0 = 0;
    for (let i = 1; i <= N; i++) {
      if (i === N || side[i] !== side[i0]) {
        const i1 = Math.min(N - 1, i);
        g.beginPath(); g.moveTo(L[i0][0], L[i0][1]);
        for (let k = i0 + 1; k <= i1; k++) g.lineTo(L[k][0], L[k][1]);
        for (let k = i1; k >= i0; k--) g.lineTo(R[k][0], R[k][1]);
        g.closePath(); g.fillStyle = side[i0] ? cA : cB; g.fill();
        i0 = i;
      }
    }
    g.lineWidth = 1.8; g.strokeStyle = DH.ink; g.lineJoin = 'round';
    [L, R].forEach(E2 => { g.beginPath(); g.moveTo(E2[0][0], E2[0][1]); for (let k = 1; k < N; k++) g.lineTo(E2[k][0], E2[k][1]); g.stroke(); });
    g.strokeStyle = 'rgba(255,244,220,0.28)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < N - 3; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke();
  }

  function scarfPts(A, t, anchor, o) {
    const pts = [], X = apsX(A, t), back = [Math.cos(X.rot) * A.dir, Math.sin(X.rot) * A.dir];
    for (let i = 0; i <= 44; i++) {
      const s = i / 44, Xt = apsX(A, t - s * o.lag), p = toW(Xt, anchor[0], anchor[1]);
      const wx = back[0] * s * o.len * A.s, wy = back[1] * s * o.len * A.s + (o.lift || 0) * A.s * s * s;
      const nl = Math.hypot(wx, wy) || 1, nx = -wy / nl, ny = wx / nl;
      const wave = Math.sin(s * o.freq * TAU - t * o.speed + o.ph) * o.amp * A.s * Math.pow(s, 1.1) + Math.sin(s * 2.1 * TAU - t * 1.1 + o.ph * 2) * o.amp * A.s * 0.35 * s;
      pts.push([p[0] + wx + nx * wave, p[1] + wy + ny * wave]);
    }
    return pts;
  }

  // tapered tube through control points (Catmull-Rom), widths interpolated along the length
  function tube(g, cps, ws, n = 24) {
    const P = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n * (cps.length - 1), k = Math.min(cps.length - 2, Math.floor(u)), f = u - k;
      const p0 = cps[Math.max(0, k - 1)], p1 = cps[k], p2 = cps[k + 1], p3 = cps[Math.min(cps.length - 1, k + 2)];
      const cr = j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f * f + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f * f * f);
      P.push([cr(0), cr(1)]);
    }
    const Lp = [], Rp = [];
    for (let i = 0; i <= n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const u = i / n * (ws.length - 1), k = Math.min(ws.length - 2, Math.floor(u)), w = lerp(ws[k], ws[k + 1], u - k) / 2;
      Lp.push([P[i][0] - dy / l * w, P[i][1] + dx / l * w]); Rp.push([P[i][0] + dy / l * w, P[i][1] - dx / l * w]);
    }
    return { P, Lp, Rp, path(q) { q.moveTo(Lp[0][0], Lp[0][1]); Lp.forEach(p => q.lineTo(p[0], p[1])); for (let i = n; i >= 0; i--) q.lineTo(Rp[i][0], Rp[i][1]); q.closePath(); } };
  }

  function drawApsara(g, A, t, idx) {
    const X = apsX(A, t);
    // the long scarves trail behind the body
    const sc = [
      { anchor: [-92, -170], len: 660, lag: 0.95, freq: 1.35, amp: 96, speed: 2.3, ph: A.ph, lift: -90, w: 30, cA: DH.lapis, cB: DH.mal, tw: [A.ph, 5.2] },
      { anchor: [-168, -22], len: 760, lag: 1.2, freq: 1.1, amp: 110, speed: 2.0, ph: A.ph + 1.7, lift: 110, w: 32, cA: DH.cin, cB: DH.ochre, tw: [A.ph + 1, 4.4] },
    ];
    sc.forEach(o => scarf(g, scarfPts(A, t, o.anchor, o), o.w * A.s, o.cA, o.cB, o.tw[0] - t * 0.6, o.tw[1]));
    g.save();
    g.translate(X.x, X.y); g.rotate(X.rot); g.scale(X.dir * X.s, X.s);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const sw = Math.sin(t * 1.3 + A.ph), sw2 = Math.sin(t * 1.9 + A.ph * 1.3);
    // hem tongues fluttering past the feet
    for (let k = 0; k < 3; k++) {
      const y0 = -50 + k * 14, fl = Math.sin(t * 2.2 - k * 0.9 + A.ph) * 12, fl2 = Math.sin(t * 2.2 - k * 0.9 - 1.4 + A.ph) * 16;
      const tb = tube(g, [[146, y0], [196, y0 - 12 + fl * 0.3], [250 + k * 10, y0 - 4 + fl], [310 + k * 16, y0 + 14 + fl2], [350 + k * 18, y0 + 4 + fl2 * 1.3]], [28 - k * 4, 24 - k * 3, 16, 8, 1]);
      dfill(g, tb.path, [DH.lapis, DH.malL, DH.lead][k], 'rgba(20,40,40,0.35)', 6, 1.5);
    }
    // skirt wrapping the bent legs
    const legs = tube(g, [[-34, 4], [24, 24], [100, 52 + sw * 2], [152, 4], [170, -46]], [54, 56, 44, 32, 22]);
    dfill(g, legs.path, DH.mal, 'rgba(24,52,40,0.5)', 16, 2);
    g.save(); g.beginPath(); legs.path(g); g.clip();
    g.strokeStyle = 'rgba(62,22,12,0.7)'; g.lineWidth = 1.4;
    [-0.3, 0.05, 0.38].forEach(f => { g.beginPath(); legs.P.forEach((p, i) => { const x = lerp(p[0], legs.Lp[i][0], f), y = lerp(p[1], legs.Lp[i][1], f); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
    g.restore();
    // waist band and knotted sash
    dfill(g, q => { q.moveTo(-40, -26); q.bezierCurveTo(-30, -6, -26, 12, -26, 30); q.lineTo(-8, 32); q.bezierCurveTo(-8, 12, -14, -8, -24, -30); q.closePath(); }, DH.cin, null, 0, 1.5);
    dfill(g, tube(g, [[-20, 26], [-4, 44], [14, 54 + sw * 3]], [9, 7, 2]).path, DH.cin, null, 0, 1.3);
    // back arm raised over the head in a long curve
    const arm2 = tube(g, [[-98, -72], [-74, -110], [-70 + sw2 * 2, -146], [-92, -172]], [20, 15, 12, 10]);
    dfill(g, arm2.path, DH.skin, 'rgba(150,72,40,0.45)', 7, 1.6);
    g.strokeStyle = DH.ochre; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-82, -106); g.lineTo(-66, -110); g.moveTo(-80, -156); g.lineTo(-66, -150); g.stroke();
    dfill(g, q => { q.moveTo(-90, -170); q.bezierCurveTo(-100, -186, -112, -184, -110, -174); q.bezierCurveTo(-104, -170, -98, -166, -94, -162); q.closePath(); }, DH.skin, null, 0, 1.3);
    // torso in three-quarter view
    const torso = q => { q.moveTo(-30, -24); q.bezierCurveTo(-52, -42, -76, -66, -94, -80); q.bezierCurveTo(-108, -80, -124, -66, -128, -50); q.bezierCurveTo(-110, -22, -82, 6, -40, 22); q.bezierCurveTo(-30, 20, -24, 6, -30, -24); q.closePath(); };
    dfill(g, torso, DH.skin, 'rgba(156,74,40,0.55)', 14, 2);
    g.strokeStyle = 'rgba(120,50,30,0.6)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-104, -40); g.quadraticCurveTo(-94, -30, -84, -36); g.stroke();
    // 络腋 band across the breast
    dfill(g, q => { q.moveTo(-96, -80); q.bezierCurveTo(-76, -52, -56, -28, -34, -14); q.lineTo(-30, -26); q.bezierCurveTo(-52, -42, -72, -64, -88, -84); q.closePath(); }, DH.lapis, null, 0, 1.4);
    // necklace 璎珞
    g.strokeStyle = DH.ochre; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-122, -60); g.bezierCurveTo(-116, -38, -98, -36, -92, -56); g.stroke();
    g.fillStyle = DH.lead; g.strokeStyle = DH.ink; g.lineWidth = 0.8;
    [[-118, -48], [-110, -41], [-101, -42], [-95, -49]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); g.stroke(); });
    g.fillStyle = DH.cin; g.beginPath(); g.arc(-106, -38, 3.6, 0, TAU); g.fill(); g.stroke();
    // head, face turned three-quarters to us
    g.save(); g.translate(-116, -66); g.rotate(-0.12 + sw * 0.05);
    dfill(g, q => { q.moveTo(-6, 8); q.lineTo(-12, -14); q.lineTo(4, -16); q.lineTo(8, 6); q.closePath(); }, DH.skin, null, 0, 1.4);
    const face = q => { q.moveTo(-6, -18); q.bezierCurveTo(-30, -14, -44, -30, -42, -48); q.bezierCurveTo(-40, -66, -22, -74, -8, -70); q.bezierCurveTo(6, -66, 10, -50, 6, -36); q.bezierCurveTo(2, -26, -2, -20, -6, -18); q.closePath(); };
    dfill(g, face, DH.skin, 'rgba(160,80,44,0.45)', 9, 1.8);
    // hair: centre-parted, swept up into a double chignon 双髻
    dfill(g, q => { q.moveTo(8, -40); q.bezierCurveTo(12, -64, -4, -82, -26, -78); q.bezierCurveTo(-40, -76, -46, -62, -44, -50); q.bezierCurveTo(-36, -62, -24, -66, -16, -62); q.bezierCurveTo(-8, -66, 2, -58, 4, -44); q.closePath(); }, DH.hair, null, 0, 1.2);
    dfill(g, q => { ell(q, -30, -94, 10, 14, -0.4); ell(q, -6, -96, 11, 15, 0.35); }, DH.hair, null, 0, 1.2);
    dfill(g, q => { q.moveTo(-34, -78); q.lineTo(-18, -110); q.lineTo(-2, -78); q.closePath(); }, DH.ochre, 'rgba(120,70,20,0.4)', 4, 1.2);
    g.fillStyle = DH.cin; g.beginPath(); g.arc(-18, -86, 3.4, 0, TAU); g.fill();
    g.fillStyle = DH.mal; g.beginPath(); g.arc(-30, -80, 2.6, 0, TAU); g.arc(-6, -80, 2.6, 0, TAU); g.fill();
    // features: arched brows, long downcast eyes, white nose ridge, small cinnabar lips
    g.strokeStyle = DH.ink; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(-36, -54); g.quadraticCurveTo(-31, -58, -26, -55); g.moveTo(-18, -55); g.quadraticCurveTo(-11, -59, -4, -55); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(-35, -49); g.quadraticCurveTo(-31, -47, -27, -49); g.moveTo(-17, -49); g.quadraticCurveTo(-12, -47, -6, -49.5); g.stroke();
    g.lineWidth = 1.1; g.beginPath(); g.moveTo(-22, -52); g.quadraticCurveTo(-25, -42, -21, -38); g.stroke();
    g.strokeStyle = 'rgba(255,250,236,0.65)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-21, -53); g.lineTo(-22, -42); g.stroke();
    g.fillStyle = DH.cin; g.beginPath(); ell(g, -21, -31, 3.6, 1.8, 0); g.fill();
    g.fillStyle = 'rgba(200,90,70,0.25)'; g.beginPath(); g.arc(-34, -38, 5, 0, TAU); g.arc(-6, -38, 4, 0, TAU); g.fill();
    g.strokeStyle = DH.ochre; g.lineWidth = 2; g.beginPath(); g.moveTo(-42, -44); g.lineTo(-44, -34); g.stroke();
    g.restore();
    // front arm reaching forward, a lotus bud in the fingers
    const arm1 = tube(g, [[-122, -54], [-150, -30], [-178, -22 + sw * 3], [-204, -40 + sw * 2]], [20, 15, 12, 10]);
    dfill(g, arm1.path, DH.skin, 'rgba(150,72,40,0.45)', 7, 1.6);
    g.strokeStyle = DH.ochre; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-150, -38); g.lineTo(-146, -22); g.moveTo(-190, -38); g.lineTo(-186, -24); g.stroke();
    g.save(); g.translate(-204, -40 + sw * 2);
    dfill(g, q => { q.moveTo(0, -6); q.bezierCurveTo(-12, -10, -18, -4, -16, 2); q.bezierCurveTo(-10, 6, -4, 6, 2, 6); q.closePath(); }, DH.skin, null, 0, 1.2);
    g.strokeStyle = DH.mal; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-24, -14, -26, -34); g.stroke();
    dfill(g, q => { q.moveTo(-26, -34); q.bezierCurveTo(-40, -42, -36, -60, -24, -66); q.bezierCurveTo(-14, -58, -12, -42, -26, -34); q.closePath(); }, DH.cin, 'rgba(255,230,210,0.5)', 6, 1.3);
    dfill(g, q => { q.moveTo(-26, -36); q.bezierCurveTo(-34, -44, -32, -54, -26, -58); q.bezierCurveTo(-20, -52, -20, -44, -26, -36); q.closePath(); }, DH.lead, null, 0, 1);
    g.restore();
    // the scarf draped over the shoulders, crossing in front
    dfill(g, tube(g, [[-98, -84], [-74, -98], [-56, -70], [-62, -32], [-92, -4], [-140, -6], [-168, -22]], [4, 8, 9, 9, 8, 7, 5]).path, DH.lead, 'rgba(90,70,50,0.35)', 3, 1.3);
    g.restore();
  }

  // painted flower: five petals, ochre heart
  function dflower(g, x, y, r, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = col; g.strokeStyle = DH.ink; g.lineWidth = 1;
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); ell(g, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.32, a); g.fill(); g.stroke(); }
    g.fillStyle = DH.ochre; g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.fill(); g.stroke();
    g.restore();
  }

  // drifting coloured cloud 流云: layered heads + a curling tail
  function dcloud(g, x, y, s, flip, t = 0) {
    g.save(); g.translate(x, y); g.scale(s * flip, s);
    const heads = [[0, 0, 40], [46, -12, 30], [80, 6, 22], [-36, 10, 24]];
    const tl = tube(g, [[-30, 16], [-90, 30 + Math.sin(t * 0.8) * 4], [-160, 22], [-230, 38 + Math.sin(t * 0.8 + 1) * 6], [-270, 26]], [30, 22, 16, 9, 1]);
    dfill(g, tl.path, DH.lapis, 'rgba(10,20,40,0.35)', 6, 1.3);
    [[DH.lapis, 1], [DH.mal, 0.76], [DH.lead, 0.5]].forEach(([col, k], li) => {
      g.fillStyle = col;
      g.beginPath(); heads.forEach(([hx, hy, r]) => { const cy = hy + (li ? r * (1 - k) * 0.45 : 0); g.moveTo(hx + r * k, cy); g.ellipse(hx, cy, r * k, r * k * 0.74, 0, 0, TAU); });
      g.fill();
      if (li === 0) { g.strokeStyle = DH.ink; g.lineWidth = 1.3; g.stroke(); }
    });
    g.strokeStyle = 'rgba(62,22,12,0.8)'; g.lineWidth = 1.1;
    heads.forEach(([hx, hy, r]) => { g.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20, a = u * TAU * 1.1, rr = r * 0.42 * (1 - u * 0.7); i ? g.lineTo(hx + Math.cos(a) * rr, hy + 4 + Math.sin(a) * rr * 0.74) : g.moveTo(hx + rr, hy + 4); } g.stroke(); });
    g.restore();
  }

  function mandalaRings() {
    const R = [];
    const mk = (r, fn) => { const sz = Math.ceil(r * 2 + 20), cv = offscreen(sz, sz), g = cv.getContext('2d'); g.translate(sz / 2, sz / 2); g.lineJoin = 'round'; fn(g); R.push({ cv, h: sz / 2 }); };
    const petal = (g, r0, r1, wa, a, col, edge) => {
      g.save(); g.rotate(a);
      g.beginPath(); g.moveTo(r0, 0); g.bezierCurveTo(r0 + (r1 - r0) * 0.3, -r1 * wa, r1 * 0.86, -r1 * wa * 0.5, r1, 0); g.bezierCurveTo(r1 * 0.86, r1 * wa * 0.5, r0 + (r1 - r0) * 0.3, r1 * wa, r0, 0); g.closePath();
      g.fillStyle = col; g.fill(); g.strokeStyle = DH.ink; g.lineWidth = 1.6; g.stroke();
      if (edge) { g.beginPath(); g.moveTo(r0 + (r1 - r0) * 0.25, 0); g.bezierCurveTo(r0 + (r1 - r0) * 0.4, -r1 * wa * 0.5, r1 * 0.8, -r1 * wa * 0.25, r1 * 0.92, 0); g.bezierCurveTo(r1 * 0.8, r1 * wa * 0.25, r0 + (r1 - r0) * 0.4, r1 * wa * 0.5, r0 + (r1 - r0) * 0.25, 0); g.fillStyle = edge; g.fill(); }
      g.restore();
    };
    // 0: flame-petal aureole
    mk(300, g => {
      for (let k = 0; k < 28; k++) petal(g, 210, 298, 0.12, k / 28 * TAU, [DH.cin, DH.ochre, DH.mal, DH.lapis][k % 4], 'rgba(255,240,210,0.25)');
    });
    // 1: scroll band 卷草
    mk(222, g => {
      g.beginPath(); g.arc(0, 0, 220, 0, TAU); g.arc(0, 0, 176, 0, TAU, true); g.fillStyle = DH.lapis; g.fill('evenodd'); g.strokeStyle = DH.ink; g.lineWidth = 2; g.stroke();
      g.strokeStyle = DH.ochre; g.lineWidth = 4; g.lineCap = 'round';
      for (let k = 0; k < 16; k++) {
        const a0 = k / 16 * TAU; g.beginPath();
        for (let i = 0; i <= 16; i++) { const u = i / 16, a = a0 + u * TAU / 16, r = 198 + Math.sin(u * TAU) * 12; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.stroke();
        const am = a0 + TAU / 64, cx = Math.cos(am) * 204, cy = Math.sin(am) * 204;
        g.save(); g.translate(cx, cy); g.rotate(am); g.fillStyle = DH.malL; g.beginPath(); ell(g, 0, 0, 9, 4, 0.6); g.fill(); g.restore();
      }
    });
    // 2: pearl roundel 联珠
    mk(172, g => {
      g.beginPath(); g.arc(0, 0, 172, 0, TAU); g.arc(0, 0, 152, 0, TAU, true); g.fillStyle = DH.groundD; g.fill('evenodd'); g.strokeStyle = DH.ink; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = DH.lead; for (let k = 0; k < 44; k++) { const a = k / 44 * TAU; g.beginPath(); g.arc(Math.cos(a) * 162, Math.sin(a) * 162, 5.2, 0, TAU); g.fill(); }
    });
    // 3: double lotus petals
    mk(152, g => {
      for (let k = 0; k < 16; k++) petal(g, 70, 150, 0.2, (k + 0.5) / 16 * TAU, k % 2 ? DH.mal : DH.lapisL, 'rgba(240,230,210,0.35)');
      for (let k = 0; k < 8; k++) petal(g, 50, 122, 0.3, k / 8 * TAU, DH.cin, 'rgba(250,225,200,0.4)');
    });
    // 4: seed pod with three hares 三兔 sharing three ears (after Mogao Cave 407)
    mk(70, g => {
      g.beginPath(); g.arc(0, 0, 68, 0, TAU); g.fillStyle = DH.lead; g.fill(); g.strokeStyle = DH.ink; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.strokeStyle = DH.cin; g.lineWidth = 3; g.stroke();
      for (let k = 0; k < 3; k++) {
        g.save(); g.rotate(k / 3 * TAU);
        g.fillStyle = DH.ochre; g.strokeStyle = DH.ink; g.lineWidth = 1.3;
        g.beginPath(); ell(g, 0, -38, 20, 9, 0); g.fill(); g.stroke();                 // body running round
        g.beginPath(); g.arc(18, -33, 7, 0, TAU); g.fill(); g.stroke();                // head
        g.beginPath(); g.moveTo(20, -28); g.quadraticCurveTo(14, -16, 4, -6); g.lineTo(9, -4); g.quadraticCurveTo(18, -16, 24, -28); g.closePath(); g.fill(); g.stroke();   // shared ear
        g.beginPath(); g.moveTo(-18, -40); g.lineTo(-26, -44); g.stroke();
        g.restore();
      }
      g.fillStyle = DH.mal; g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill();
    });
    return R;
  }

  function cartouche() {
    const w = 150, h = 430, cv = offscreen(w + 140, h + 160), g = cv.getContext('2d');
    g.translate((w + 140) / 2, (h + 160) / 2); g.lineJoin = 'round';
    // lotus-leaf canopy and lotus pedestal
    const cap = q => { q.moveTo(-w / 2 - 40, -h / 2 + 6); q.bezierCurveTo(-w / 2 - 20, -h / 2 - 50, w / 2 + 20, -h / 2 - 50, w / 2 + 40, -h / 2 + 6); q.bezierCurveTo(w / 4, -h / 2 - 8, -w / 4, -h / 2 - 8, -w / 2 - 40, -h / 2 + 6); q.closePath(); };
    dfill(g, cap, DH.mal, 'rgba(30,60,40,0.4)', 10, 2);
    for (let k = 0; k < 7; k++) { const x = lerp(-w / 2 - 30, w / 2 + 30, k / 6); g.strokeStyle = DH.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -h / 2 - 34); g.quadraticCurveTo(x * 0.6, -h / 2 - 30, x, -h / 2 + 2); g.stroke(); }
    for (let k = 0; k < 7; k++) { const a = PI + (k + 0.5) / 7 * PI; const x0 = Math.cos(a) * (w / 2 + 34), petal = q => { q.moveTo(x0 - 18, h / 2 - 4); q.quadraticCurveTo(x0, h / 2 + 44 + Math.sin(a) * -6, x0 + 18, h / 2 - 4); q.closePath(); }; dfill(g, petal, k % 2 ? DH.cin : DH.lapisL, 'rgba(80,30,20,0.35)', 6, 1.6); }
    // panel
    dfill(g, q => q.rect(-w / 2 - 12, -h / 2 - 4, w + 24, h + 8), DH.cin, null, 0, 2);
    dfill(g, q => q.rect(-w / 2, -h / 2 + 8, w, h - 16), DH.lead, 'rgba(120,100,70,0.35)', 18, 1.6);
    g.strokeStyle = DH.mal; g.lineWidth = 4; g.strokeRect(-w / 2 + 9, -h / 2 + 17, w - 18, h - 34);
    g.fillStyle = '#26160e'; g.font = '900 78px "Noto Serif SC"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['敦', '煌', '飞', '天'].forEach((ch, i) => g.fillText(ch, 0, -h / 2 + 64 + i * 98));
    return cv;
  }

  MG.film({
    id: 'dunhuang', dur: 10, poster: 9.5,
    fonts: [['900 78px "Noto Serif SC"', '敦煌飞天'], ['500 40px "Cormorant SC"', 'DUNHUANG FLYING APSARAS MOGAO CAVES'], ['italic 500 30px "Cormorant Garamond"', 'Mogao Caves, 4th–14th century']],
    meta: {
      family: 'I', name: 'Dunhuang Murals', sub: 'Mogao 敦煌壁画', era: '4th–14th c.',
      origin: 'Over a thousand years, painters on the Silk Road covered the Mogao Caves near Dunhuang with mineral-pigment murals of Buddhist paradises, where flying apsaras (feitian) ride on trailing silk scarves. The Shanghai Animation Film Studio adapted the Cave 257 jataka into Nine-Coloured Deer in 1981.',
      works: 'Mogao Cave 257 Deer King Jataka (Northern Wei) · Cave 320 flying apsaras (Tang) · Cave 407 three-hare lotus ceiling (Sui) · Nine-Coloured Deer (Shanghai Animation Film Studio, 1981) · Dream of Dunhuang dance drama (Gansu, 1979)',
      tech: ['Mineral pigments on plaster', 'Iron-wire outline & contour shading', 'Trailing-scarf secondary motion'],
      accent: '#3e8a6c',
      motionDNA: 'Slow weightless glides on long curves, with the silk scarves doing the dancing: they trail the path, twist to show both faces, and keep rippling after the figure comes to rest.',
      visualDNA: 'Malachite, lapis, cinnabar and ochre on an earth-red ground, darkened flesh shading and fine iron-wire lines, under a skin of cracks and flaking plaster.',
      transitions: 'Lamp-light reveal, slow pull-back, ring-by-ring lotus bloom, flower rain, cartouche fade-in',
      implementation: ['Mineral pigment on plaster', 'Procreate / Photoshop + AE', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, K = 1.25, r = rng(257);
      const wall = offscreen(W * K, H * K), g = wall.getContext('2d');
      g.scale(K, K);
      g.fillStyle = DH.ground; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) {
        const x = r() * W, y = r() * H, rr = 10 + r() * r() * 120, col = r() < 0.5 ? '184,105,63' : (r() < 0.6 ? '110,48,32' : '160,90,60');
        const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${col},${0.05 + r() * 0.12})`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      // a faded lapis heaven over the upper wall
      for (let i = 0; i < 70; i++) { const x = r() * W, y = 120 + r() * 300, rr = 80 + r() * 200, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${r() < 0.6 ? '47,86,135' : '62,138,108'},${0.06 + r() * 0.08})`); gr.addColorStop(1, 'rgba(47,86,135,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      // painted scatter-flowers on the ground
      for (let i = 0; i < 70; i++) { const x = r() * W, y = 150 + r() * (H - 320); if (Math.hypot(x - DC.x, y - DC.y) < 340) continue; g.globalAlpha = 0.55 + r() * 0.3; dflower(g, x, y, 5 + r() * 5, r() * TAU, r() < 0.5 ? DH.lead : DH.malL); }
      g.globalAlpha = 1;
      // lotus pond at the foot of the scene (left and right of centre)
      for (let i = 0; i < 16; i++) {
        const side = i % 2 ? 1 : -1, x = side > 0 ? 1330 + r() * 560 : 30 + r() * 560, y = 900 + r() * 40, sc = 0.7 + r() * 0.5;
        g.save(); g.translate(x, y); g.scale(sc, sc);
        dfill(g, q => ell(q, 0, 10, 44, 12, 0), DH.mal, 'rgba(20,50,40,0.4)', 6, 1.4);
        g.strokeStyle = DH.ink; g.lineWidth = 1; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(0, 10); g.lineTo(k * 13, 10 + (Math.abs(k) < 2 ? -8 : 2)); g.stroke(); }
        if (r() < 0.6) { g.strokeStyle = DH.mal; g.lineWidth = 2.5; g.beginPath(); g.moveTo(10, 6); g.quadraticCurveTo(14, -20, 8, -36); g.stroke();
          for (let k = 0; k < 5; k++) { const a = -PI / 2 + (k - 2) * 0.42; dfill(g, q => { q.save(); q.translate(8, -36); q.rotate(a + PI / 2); q.moveTo(0, 0); q.bezierCurveTo(-9, -10, -6, -26, 0, -32); q.bezierCurveTo(6, -26, 9, -10, 0, 0); q.restore(); }, k % 2 ? DH.lead : DH.cin, 'rgba(120,40,30,0.3)', 4, 1.1); } }
        g.restore();
      }
      // top valance 垂幔 and lower honeysuckle band 忍冬
      g.fillStyle = DH.groundD; g.fillRect(0, 0, W, 70);
      g.fillStyle = DH.lapis; g.fillRect(0, 56, W, 16);
      for (let x = -40, k = 0; x < W + 60; x += 64, k++) {
        dfill(g, q => { q.moveTo(x - 32, 72); q.quadraticCurveTo(x, 112, x + 32, 72); q.closePath(); }, k % 2 ? DH.lapisL : DH.ochre, 'rgba(40,20,10,0.3)', 5, 1.3);
        dfill(g, q => { q.moveTo(x + 4, 72); q.lineTo(x + 60, 72); q.lineTo(x + 32, 124); q.closePath(); }, [DH.mal, DH.cin, DH.lead, DH.mal][k % 4], 'rgba(40,20,10,0.3)', 6, 1.6);
        g.strokeStyle = DH.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 32, 128); g.lineTo(x + 32, 142); g.stroke();
        g.fillStyle = DH.ochre; g.beginPath(); g.arc(x + 32, 146, 4.5, 0, TAU); g.fill(); g.stroke();
      }
      g.fillStyle = DH.lead; for (let x = 8; x < W; x += 16) { g.beginPath(); g.arc(x, 64, 2.6, 0, TAU); g.fill(); }
      g.fillStyle = DH.lapis; g.fillRect(0, H - 120, W, 120);
      g.fillStyle = DH.groundD; g.fillRect(0, H - 128, W, 10); g.fillRect(0, H - 22, W, 22);
      g.strokeStyle = DH.ochre; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); for (let x = 0; x <= W; x += 6) { const y = H - 70 + Math.sin(x / 90 * PI) * 26; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      for (let x = 45; x < W; x += 90) { const up = Math.round(x / 90) % 2 ? -1 : 1; g.save(); g.translate(x, H - 70 + up * 26 * 0); g.fillStyle = up > 0 ? DH.malL : DH.cin; for (let k = 0; k < 3; k++) { g.save(); g.rotate(-0.9 + k * 0.9 + (up > 0 ? PI : 0)); g.beginPath(); ell(g, 0, -22, 7, 18, 0); g.fill(); g.restore(); } g.restore(); }
      // lamp soot creeping from the top
      const soot = g.createLinearGradient(0, 0, 0, 420); soot.addColorStop(0, 'rgba(30,14,8,0.4)'); soot.addColorStop(1, 'rgba(30,14,8,0)'); g.fillStyle = soot; g.fillRect(0, 0, W, 420);
      // pigment grain
      const tile = offscreen(256, 256), tg = tile.getContext('2d'), id = tg.createImageData(256, 256);
      for (let k = 0; k < id.data.length; k += 4) { const v = 128 + (r() - 0.5) * 90; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; }
      tg.putImageData(id, 0, 0);
      // damage overlay: cracks, flakes, losses — painted over everything, follows the wall
      const dmg = offscreen(W * K, H * K), d = dmg.getContext('2d');
      d.scale(K, K);
      const avoid = (x, y) => Math.abs(x - DC.x) < 120 && Math.abs(y - DC.y) < 270;
      const flake = (x, y, R0, big) => {
        const n = 14 + Math.floor(r() * 8), pts = [];
        for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = R0 * (0.55 + r() * 0.6); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (0.6 + r() * 0.5)]); }
        d.beginPath(); smooth(d, pts); d.fillStyle = big ? DH.plasterD : (r() < 0.4 ? '#8f6a4c' : DH.plaster); d.fill();
        d.save(); d.clip();
        for (let i = 0; i < R0 * 1.5; i++) { d.fillStyle = r() < 0.5 ? 'rgba(120,90,60,0.25)' : 'rgba(255,248,230,0.3)'; d.fillRect(x + (r() - 0.5) * R0 * 2, y + (r() - 0.5) * R0 * 2, 1 + r() * 2, 1 + r() * 2); }
        if (big) { d.strokeStyle = 'rgba(150,120,70,0.6)'; d.lineWidth = 1; for (let i = 0; i < R0 / 3; i++) { const sx = x + (r() - 0.5) * R0 * 1.6, sy = y + (r() - 0.5) * R0 * 1.2, a = r() * PI; d.beginPath(); d.moveTo(sx, sy); d.lineTo(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10); d.stroke(); } }
        d.lineWidth = 3; d.strokeStyle = 'rgba(80,40,20,0.35)'; d.beginPath(); smooth(d, pts.map(([px, py]) => [px + 1.5, py + 2])); d.stroke();
        d.restore();
        d.lineWidth = 1.2; d.strokeStyle = 'rgba(70,35,18,0.65)'; d.beginPath(); smooth(d, pts); d.stroke();
      };
      [[60, 980, 150], [1880, 120, 130], [1840, 1010, 110], [30, 260, 90], [1250, 1060, 80]].forEach(([x, y, R0]) => flake(x, y, R0, true));
      for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, R0 = 6 + r() * r() * 30; if (!avoid(x, y)) flake(x, y, R0, false); }
      for (let i = 0; i < 26; i++) {   // crack networks
        let x = r() * W, y = r() * H, a = r() * TAU;
        const steps = 18 + Math.floor(r() * 40), pts = [[x, y]];
        for (let s2 = 0; s2 < steps; s2++) { a += (r() - 0.5) * 0.9; const l = 6 + r() * 16; x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]); if (r() < 0.08) { let bx = x, by = y, ba = a + (r() < 0.5 ? 1 : -1) * (0.6 + r()); d.beginPath(); d.moveTo(bx, by); for (let k = 0; k < 6; k++) { ba += (r() - 0.5) * 0.8; bx += Math.cos(ba) * 10; by += Math.sin(ba) * 10; d.lineTo(bx, by); } d.strokeStyle = 'rgba(40,18,10,0.45)'; d.lineWidth = 0.9; d.stroke(); } }
        pts.forEach(([px, py], k) => { if (k % 9 === 4 && r() < 0.5 && !avoid(px, py)) flake(px, py, 3 + r() * 9, false); });
        d.beginPath(); pts.forEach(([px, py], k) => (k ? d.lineTo(px + 0.8, py + 1) : d.moveTo(px + 0.8, py + 1))); d.strokeStyle = 'rgba(255,236,210,0.22)'; d.lineWidth = 1.2; d.stroke();
        d.beginPath(); pts.forEach(([px, py], k) => (k ? d.lineTo(px, py) : d.moveTo(px, py))); d.strokeStyle = 'rgba(40,18,10,0.6)'; d.lineWidth = 1.4; d.stroke();
      }
      for (let i = 0; i < 900; i++) { d.fillStyle = r() < 0.6 ? 'rgba(40,20,10,0.35)' : 'rgba(250,236,210,0.3)'; d.beginPath(); d.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, TAU); d.fill(); }
      // flowers released from the dishes (birth time, which apsara, scatter)
      const petals = [];
      for (let i = 0; i < 64; i++) petals.push({ tb: 4.6 + r() * 3.6, a: i % 2, vx: 40 + r() * 120, vy: -40 - r() * 80, w: (r() - 0.5) * 3, r: 7 + r() * 6, col: [DH.lead, DH.cin, DH.lapisL, DH.lead][i % 4], ph: r() * TAU });
      for (let i = 0; i < 30; i++) petals.push({ tb: 5.6 + r() * 2.6, a: -1, x0: 200 + r() * 1520, vx: (r() - 0.5) * 30, vy: 0, w: (r() - 0.5) * 2, r: 6 + r() * 5, col: [DH.lead, DH.cin, DH.malL][i % 3], ph: r() * TAU });
      const motes = Array.from({ length: 70 }, () => [r() * W, r() * H, r() * TAU, 0.5 + r() * 1.5]);
      const clouds = [[300, 230, 0.9, 1, 0], [1600, 210, 0.8, -1, 1], [1730, 790, 0.7, 1, 2], [240, 770, 0.75, -1, 3], [1850, 630, 0.55, 1, 4], [80, 620, 0.55, -1, 5]];
      return { wall, dmg, tile, rings: mandalaRings(), cart: cartouche(), petals, motes, clouds, P: offscreen(W, H) };
    },
    draw(c, t, W, H, st) {
      // camera: start close on the right where the first apsara enters, pull back to the whole wall
      const z = kf(t, [[0, 1.3], [1.0, 1.28], [5.0, 1.0, E.ioS], [10, 0.985, E.lin]]);
      let fx = kf(t, [[0, 1420], [1.0, 1380], [5.0, 960, E.ioS]]), fy = kf(t, [[0, 520], [5.0, 540, E.ioS]]);
      fx = clamp(fx, 960 / Math.min(1, z), 1920 - 960 / Math.min(1, z)); fy = clamp(fy, 540 / Math.min(1, z), 1080 - 540 / Math.min(1, z));
      c.fillStyle = '#120804'; c.fillRect(0, 0, W, H);
      c.save();
      c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-fx, -fy);
      c.drawImage(st.wall, 0, 0, W, H);
      // clouds drift
      st.clouds.forEach(([x, y, s, f, i]) => { c.globalAlpha = 0.86; dcloud(c, x + t * 9 * f + vnoise(t * 0.3, i) * 6, y + Math.sin(t * 0.5 + i) * 5, s, f, t + i); });
      c.globalAlpha = 1;
      // mandala bloom, ring by ring from the centre
      const bl = [0, 1, 2, 3, 4].map(k => seg(t, 3.6 + (4 - k) * 0.5, 4.9 + (4 - k) * 0.5));
      const recede = E.ioS(seg(t, 7.6, 8.6));
      st.rings.forEach((R, k) => {
        const b = bl[k]; if (b <= 0) return;
        const sc2 = (0.55 + 0.45 * E.outB(b, 1.3)) * (1 - recede * 0.1), rot = (k % 2 ? -1 : 1) * (t - 3.6) * 0.035 + (1 - E.outC(b)) * (k % 2 ? 0.6 : -0.6);
        c.save(); c.translate(DC.x, DC.y); c.rotate(rot); c.scale(sc2, sc2); c.globalAlpha = E.outQ(b) * (k === 4 ? 1 - recede : 1) * 0.96;
        c.drawImage(R.cv, -R.h, -R.h); c.restore();
      });
      c.globalAlpha = 1;
      // glow behind the bloom (gold leaf catching the lamp)
      const gl = bump(t, 5.6, 1.0, 0.5, 1.6);
      if (gl > 0) { const gg = c.createRadialGradient(DC.x, DC.y, 0, DC.x, DC.y, 420); gg.addColorStop(0, `rgba(255,220,150,${0.35 * gl})`); gg.addColorStop(1, 'rgba(255,200,120,0)'); c.globalCompositeOperation = 'screen'; c.fillStyle = gg; c.fillRect(DC.x - 420, DC.y - 420, 840, 840); c.globalCompositeOperation = 'source-over'; }
      // the cartouche 榜题
      const ca = E.outC(seg(t, 7.9, 8.9));
      if (ca > 0) {
        c.save(); c.globalAlpha = ca; c.translate(DC.x, DC.y + 10 + (1 - ca) * 16); c.drawImage(st.cart, -st.cart.width / 2, -st.cart.height / 2); c.restore();
      }
      // apsaras
      APS.forEach((A, i) => { if (A.bg) { c.globalAlpha = 0.82; drawApsara(c, A, t, i); c.globalAlpha = 1; } });
      APS.forEach((A, i) => { if (!A.bg) drawApsara(c, A, t, i); });
      // flowers
      st.petals.forEach(p => {
        const age = t - p.tb; if (age < 0) return;
        let x, y;
        if (p.a >= 0) {
          const X = apsX(APS[p.a], p.tb), hp = toW(X, -230, -96), toC = Math.sign(DC.x - hp[0]);
          const k = 1.2, dr = (1 - Math.exp(-age * k)) / k;
          x = hp[0] + toC * p.vx * dr + Math.sin(age * 1.3 + p.ph) * 14; y = hp[1] + p.vy * dr + 22 * age * age * 0.5 + 18 * age;
        } else { x = p.x0 + p.vx * age + Math.sin(age * 1.1 + p.ph) * 20; y = 120 + 60 * age + 8 * age * age; }
        if (y > 1000) return;
        c.globalAlpha = Math.min(1, age * 3);
        dflower(c, x, y, p.r, p.ph + age * p.w, p.col);
      });
      c.globalAlpha = 1;
      // weathering on top of every painted thing
      c.drawImage(st.dmg, 0, 0, W, H);
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.16; c.fillStyle = c.createPattern(st.tile, 'repeat'); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.restore();
      // English line under the cartouche (screen space, cut in gold)
      if (ca > 0) {
        const ea = E.outC(seg(t, 8.3, 9.2));
        text(c, 'DUNHUANG  ·  FLYING APSARAS', W / 2, 884, { font: '"Cormorant SC"', weight: 700, size: 40, align: 'center', ls: 10, color: `rgba(246,226,180,${ea})` });
        text(c, 'Mogao Caves, 4th–14th century', W / 2, 922, { font: '"Cormorant Garamond"', style: 'italic', weight: 500, size: 28, align: 'center', color: `rgba(236,206,160,${ea * 0.8})` });
      }
      // lamp light: a moving pool that opens into the full wall
      const X1 = apsX(APS[0], t), sx1 = (X1.x - fx) * z + W / 2 - 120, sy1 = (X1.y - fy) * z + H / 2 - 40, fo = E.ioS(seg(t, 1.2, 2.4));
      const lx = lerp(sx1, 960, fo), ly = lerp(sy1, 540, fo);
      const lr = kf(t, [[0, 160], [0.45, 520, E.outC], [1.1, 600], [2.4, 1600, E.ioS]]);
      const fl = 1 + 0.05 * vnoise(t * 8, 2) + 0.03 * vnoise(t * 19, 6);
      const dk = c.createRadialGradient(lx, ly, lr * 0.15, lx, ly, lr * fl);
      dk.addColorStop(0, 'rgba(10,4,2,0)'); dk.addColorStop(0.6, `rgba(10,4,2,${0.3 * (1 - seg(t, 1.8, 2.8))})`); dk.addColorStop(1, `rgba(10,4,2,${0.97 - 0.4 * seg(t, 1.5, 3.0)})`);
      c.fillStyle = dk; c.fillRect(0, 0, W, H);
      const warm = c.createRadialGradient(lx, ly, 0, lx, ly, lr * 1.2);
      warm.addColorStop(0, `rgba(255,190,110,${0.18 * fl})`); warm.addColorStop(1, 'rgba(255,170,90,0)');
      c.globalCompositeOperation = 'soft-light'; c.fillStyle = warm; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
      // dust motes in the lamp beam
      st.motes.forEach(([mx, my, ph, s]) => {
        const x = (mx + t * 14 + Math.sin(t * 0.7 + ph) * 20) % W, y = (my - t * 9 + 2000) % H, dd = Math.hypot(x - lx, y - ly) / lr;
        const a = clamp(1 - dd) * 0.5; if (a < 0.02) return;
        c.fillStyle = `rgba(255,230,180,${a})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
      });
      vignette(c, W, H, 0.72, '18,8,4');
      grain(c, W, H, t, 0.1, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const D = [50, 52, 54, 57, 59];   // D gong pentatonic
      const deg = (d, o = 0) => D[((d % 5) + 5) % 5] + 12 * (Math.floor(d / 5) + o);
      const pipa = (t, m, o = {}) => A.pluck(t, midi(m), { dur: 2.4, g: o.g ?? 0.3, bright: 0.85, decay: 0.9955, rev: 0.45, pan: o.pan ?? -0.15, ...o });
      const lun = (t, m, d, g = 0.14) => { const n = Math.floor(d / 0.055); for (let i = 0; i < n; i++) pipa(t + i * 0.055, m, { g: g * (0.7 + 0.3 * Math.sin(i * 0.9)), dur: 0.5 }); };   // 轮指 tremolo
      const xiao = (t, m, d, o = {}) => {
        const f = midi(m);
        A.osc(t, { f: f * 0.985, f2: f, glide: 0.25, dur: d, g: o.g ?? 0.06, a: 0.25, hold: true, rel: 0.5, vib: [4.8, f * 0.006], rev: 0.6, pan: 0.2 });
        A.noise(t, { type: 'bandpass', f: f * 2, q: 3, dur: d, g: (o.g ?? 0.06) * 0.5, a: 0.2, hold: true, rel: 0.5, rev: 0.5, pan: 0.2 });
      };
      const bowl = (t, m, g = 0.12, pan = 0) => A.bell(t, midi(m), { ratios: [1, 2.71, 5.1, 8.2], g, dur: 4, rev: 0.7, pan });
      const temple = (t, g = 0.2) => { A.bell(t, midi(38), { ratios: [1, 2.02, 2.76, 4.1, 5.4], g, dur: 6, rev: 0.6 }); A.osc(t, { f: midi(26), dur: 4, g: g * 0.5, a: 0.01 }); };
      // cave air
      A.noise(0, { type: 'bandpass', f: 380, q: 0.6, dur: 9.9, g: 0.05, a: 1.5, hold: true, rel: 1.5, rev: 0.4 });
      A.noise(0, { type: 'lowpass', f: 160, dur: 9.9, g: 0.05, a: 2, hold: true, rel: 1.2 });
      temple(0.25, 0.22);
      A.noise(0.4, { type: 'bandpass', f: 1200, q: 0.7, dur: 1.4, g: 0.04, swell: 0.4, rev: 0.4 });   // the lamp is carried in
      A.osc(0.3, { f: midi(38), dur: 9.6, g: 0.035, a: 2.5, hold: true, rel: 1.5, type: 'triangle', lp: 500 });
      A.osc(0.3, { f: midi(45), dur: 9.6, g: 0.02, a: 3, hold: true, rel: 1.5, type: 'triangle', lp: 700 });
      // first apsara: xiao + sparse pipa
      xiao(1.3, 69, 1.4); xiao(2.75, 71, 0.6); xiao(3.4, 74, 1.5, { g: 0.065 });
      [[1.5, 0], [2.1, 2], [2.6, 3], [3.2, 4], [3.9, 3]].forEach(([tt, d], i) => pipa(tt, deg(d, 1), { pan: -0.2 + i * 0.05 }));
      // second apsara: konghou-like harp glissando
      for (let i = 0; i < 12; i++) pipa(2.2 + i * 0.06, deg(i, 1), { g: 0.13, dur: 1.8, bright: 0.6, pan: -0.6 + i * 0.05 });
      // mandala: one bowl per ring, low to high
      [0, 1, 2, 3, 4].forEach(k => bowl(3.6 + k * 0.5, deg(k * 2, 2), 0.09, (k - 2) * 0.25));
      for (let i = 0; i < 16; i++) pipa(3.7 + i * 0.15, deg([0, 2, 4, 3, 5, 4, 6, 5][i % 8], 1 + (i > 7 ? 1 : 0)), { g: 0.15, dur: 1.6 });
      // climax: tremolo swell + big bell + pipa sweep
      lun(5.8, deg(5, 1), 0.8, 0.13); lun(6.6, deg(7, 1), 0.6, 0.14);
      A.riser(5.4, 1.2, { g: 0.06, f: 146 });
      temple(6.6, 0.2); bowl(6.6, deg(10, 1), 0.12);
      [50, 57, 62, 66, 69].forEach((m, i) => pipa(6.6 + i * 0.03, m, { g: 0.22, dur: 3 }));
      xiao(6.7, 78, 1.0, { g: 0.06 }); xiao(7.7, 76, 0.4, { g: 0.055 }); xiao(8.1, 74, 1.6, { g: 0.06 });
      // flowers: tiny bells
      for (let i = 0; i < 14; i++) A.bell(5.0 + hash(i * 3.1) * 3.2, midi(deg(10 + Math.floor(hash(i) * 5), 1)), { g: 0.025, dur: 1.2, rev: 0.7, pan: hash(i + 9) - 0.5 });
      // cartouche
      temple(8.6, 0.18);
      [38, 45, 50, 57, 62].forEach((m, i) => pipa(8.62 + i * 0.04, m, { g: 0.2, dur: 3.2, bright: 0.7 }));
      bowl(9.0, 74, 0.06, 0.3);
    },
  });

  /* =====================================================================
     03  PAPEL PICADO — cut tissue banners over a Día de Muertos street
     ===================================================================== */
  const PPC = ['#ff3d8b', '#ff8a1f', '#9b45e0', '#22c25e', '#1aa6ec', '#ffd23a', '#ee2a44'];
  const FW = 320, FH = 410;          // flag sprite size
  const PF = 900, HZ = 790;          // focal length (px), horizon
  const ROWZ = [4.2, 7.4, 10.6, 13.8, 17.0, 22.0, 25.6, 29.4, 33.6, 38.4, 44, 51, 59];
  const TITLE_ROW = 5, ZEND = 22.0 - 4.1;
  const TITLE = 'PAPEL PICADO';

  // a cut tissue flag: border cuts, zigzag hem, lattice field with a solid motif left standing
  function makeFlag(design, col, letter, w = FW, h = FH, fine = 1) {
    const cv = offscreen(w, h), g = cv.getContext('2d'), k = w / FW;
    g.save(); g.scale(k, k);
    const W0 = FW, H0 = FH;
    // tissue with a faint sheen, zigzag hem
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W0, 0); g.lineTo(W0, H0 - 22);
    for (let x = W0, i = 0; x >= 0; x -= 16, i++) g.lineTo(x, i % 2 ? H0 : H0 - 22);
    g.closePath();
    const gr = g.createLinearGradient(0, 0, W0, H0); gr.addColorStop(0, col); gr.addColorStop(0.5, col); gr.addColorStop(1, col);
    g.fillStyle = gr; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.10)'; for (let i = 0; i < 9; i++) g.fillRect(0, 30 + i * 44, W0, 2);   // tissue creases
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, 0, W0, 22);   // folded over the cord
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000';
    // border: triangles under the fold, dots down the sides
    for (let x = 14; x < W0 - 10; x += 18) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 12, 32); g.lineTo(x + 6, 42); g.closePath(); g.fill(); }
    for (let y = 56; y < H0 - 50; y += 16) { [12, W0 - 12].forEach(x => { g.beginPath(); g.arc(x, y, 3.6, 0, TAU); g.fill(); }); }
    for (let x = 22; x < W0 - 16; x += 16) { g.beginPath(); ell(g, x + 4, H0 - 40, 5, 3, 0); g.fill(); }
    // lattice field minus the motif (dilated so bridges hold it)
    const fx = 26, fy = 52, fw = W0 - 52, fh = H0 - 112, cx = W0 / 2, cy = fy + fh / 2;
    const M = offscreen(w, h), m = M.getContext('2d');
    m.scale(k, k); m.fillStyle = '#000'; m.strokeStyle = '#000';
    m.save(); m.beginPath(); m.rect(fx, fy, fw, fh); m.clip();
    if (design === 'letter') {
      for (let y = fy + 6, j = 0; y < fy + fh; y += 13, j++) for (let x = fx + 6 + (j % 2) * 6.5; x < fx + fw; x += 13) { m.beginPath(); m.arc(x, y, 3.2, 0, TAU); m.fill(); }
    } else if (design === 'paloma') {
      for (let y = fy + 6, j = 0; y < fy + fh; y += 15, j++) for (let x = fx + 6 + (j % 2) * 7.5; x < fx + fw; x += 15) { m.beginPath(); m.moveTo(x, y - 6); m.lineTo(x + 5.5, y); m.lineTo(x, y + 6); m.lineTo(x - 5.5, y); m.closePath(); m.fill(); }
    } else {
      for (let ring = 0, R = 30; R < 220; ring++, R += 22 * fine) {
        const n = Math.floor(R * TAU / (20 * fine));
        for (let i = 0; i < n; i++) { const a = (i + (ring % 2) * 0.5) / n * TAU; m.beginPath(); ell(m, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 7.5 * fine, 3.6 * fine, a); m.fill(); }
      }
    }
    m.restore();
    m.globalCompositeOperation = 'destination-out'; m.lineWidth = 12; m.lineJoin = 'round';
    const motif = q => {
      q.beginPath();
      if (design === 'calavera') {
        q.arc(cx, cy - 18, 78, 0, TAU);
        q.moveTo(cx - 46, cy + 30); q.lineTo(cx + 46, cy + 30); q.lineTo(cx + 40, cy + 84); q.quadraticCurveTo(cx, cy + 100, cx - 40, cy + 84); q.closePath();
      } else if (design === 'flor') {
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ell(q, cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 40, 17, a); }
        q.moveTo(cx + 40, cy); q.arc(cx, cy, 40, 0, TAU);
      } else if (design === 'paloma') {
        q.moveTo(cx - 92, cy + 10); q.bezierCurveTo(cx - 60, cy - 30, cx + 10, cy - 20, cx + 56, cy - 34); q.bezierCurveTo(cx + 70, cy - 52, cx + 96, cy - 44, cx + 100, cy - 30);
        q.lineTo(cx + 120, cy - 22); q.lineTo(cx + 98, cy - 16); q.bezierCurveTo(cx + 80, cy + 20, cx + 20, cy + 46, cx - 40, cy + 34); q.lineTo(cx - 100, cy + 70); q.lineTo(cx - 92, cy + 30); q.lineTo(cx - 118, cy + 40); q.closePath();
        q.moveTo(cx - 20, cy - 10); q.bezierCurveTo(cx - 40, cy - 90, cx + 10, cy - 128, cx + 40, cy - 120); q.bezierCurveTo(cx + 20, cy - 80, cx + 30, cy - 40, cx + 20, cy - 16); q.closePath();
      } else if (design === 'corazon') {
        q.moveTo(cx, cy + 92); q.bezierCurveTo(cx - 110, cy + 10, cx - 92, cy - 70, cx - 40, cy - 66); q.bezierCurveTo(cx - 16, cy - 64, cx, cy - 44, cx, cy - 34); q.bezierCurveTo(cx, cy - 44, cx + 16, cy - 64, cx + 40, cy - 66); q.bezierCurveTo(cx + 92, cy - 70, cx + 110, cy + 10, cx, cy + 92); q.closePath();
        q.moveTo(cx - 16, cy - 50); q.bezierCurveTo(cx - 26, cy - 90, cx - 4, cy - 100, cx, cy - 128); q.bezierCurveTo(cx + 8, cy - 100, cx + 28, cy - 92, cx + 16, cy - 50); q.closePath();
      }
    };
    if (design === 'letter') {
      m.fillRect(fx + 22, fy + 22, fw - 44, fh - 44);   // a clean panel for the letter
    } else { motif(m); m.fill(); m.stroke(); }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(M, 0, 0); g.restore();
    // details cut into the standing motif
    g.lineCap = 'round';
    if (design === 'calavera') {
      [-1, 1].forEach(sx => {
        g.beginPath(); g.arc(cx + sx * 32, cy - 10, 22, 0, TAU); g.fill();
        g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.arc(cx + sx * 32 + Math.cos(a) * 31, cy - 10 + Math.sin(a) * 31, 3.4, 0, TAU); g.fill(); }
        g.lineWidth = 4; g.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20, a = sx * u * TAU, rr = 12 * (1 - u * 0.7); i ? g.lineTo(cx + sx * 62 + Math.cos(a) * rr, cy + 34 + Math.sin(a) * rr) : g.moveTo(cx + sx * 62 + rr, cy + 34); } g.stroke();
      });
      g.lineWidth = 3.2; g.beginPath(); g.arc(cx, cy - 18, 70, PI * 0.78, PI * 2.22); g.stroke();
      g.beginPath(); g.moveTo(cx - 38, cy + 44); g.lineTo(cx + 38, cy + 44); g.stroke();
      [-1, 1].forEach(sx => { for (let i = 0; i < 5; i++) { const a = -PI / 2 + i / 4 * PI * 0.5 * sx; g.beginPath(); ell(g, cx + sx * 50 + Math.cos(a) * 9, cy - 58 + Math.sin(a) * 9, 5, 2.6, a); g.fill(); } });
      g.beginPath(); g.moveTo(cx, cy + 34); g.bezierCurveTo(cx - 16, cy + 22, cx - 12, cy + 8, cx, cy + 16); g.bezierCurveTo(cx + 12, cy + 8, cx + 16, cy + 22, cx, cy + 34); g.fill();
      g.lineWidth = 5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * 11, cy + 52); g.lineTo(cx + i * 11, cy + 76); g.stroke(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); ell(g, cx + Math.cos(a) * 14, cy - 66 + Math.sin(a) * 14, 9, 4.5, a); g.fill(); }
      g.beginPath(); g.arc(cx, cy - 66, 4, 0, TAU); g.fill();
    } else if (design === 'flor') {
      g.lineWidth = 4; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44); g.lineTo(cx + Math.cos(a) * 86, cy + Math.sin(a) * 86); g.stroke(); }
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 4.5, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(cx, cy, 11, 0, TAU); g.fill();
    } else if (design === 'paloma') {
      g.beginPath(); g.arc(cx + 82, cy - 34, 4.5, 0, TAU); g.fill();
      g.lineWidth = 4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 6 + i * 12, cy - 22); g.quadraticCurveTo(cx - 10 + i * 12, cy - 70, cx + 6 + i * 10, cy - 100 + i * 8); g.stroke(); }
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - 70, cy + 30); g.lineTo(cx - 104 + i * 6, cy + 42 + i * 10); g.stroke(); }
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx - 30 + i * 22, cy + 12, 4, 0, TAU); g.fill(); }
    } else if (design === 'corazon') {
      g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy + 66); g.bezierCurveTo(cx - 76, cy + 6, cx - 64, cy - 46, cx - 34, cy - 44); g.bezierCurveTo(cx - 14, cy - 42, cx, cy - 26, cx, cy - 16); g.bezierCurveTo(cx, cy - 26, cx + 14, cy - 42, cx + 34, cy - 44); g.bezierCurveTo(cx + 64, cy - 46, cx + 76, cy + 6, cx, cy + 66); g.stroke();
      g.fillRect(cx - 4, cy - 20, 8, 46); g.fillRect(cx - 18, cy - 6, 36, 8);
      g.beginPath(); g.moveTo(cx, cy - 66); g.quadraticCurveTo(cx - 8, cy - 90, cx, cy - 108); g.quadraticCurveTo(cx + 8, cy - 90, cx, cy - 66); g.fill();
    } else if (design === 'letter') {
      g.font = '400 236px Ultra'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(letter, cx, cy + 14);
      g.lineWidth = 3; g.strokeRect(fx + 30, fy + 30, fw - 60, fh - 60);
    }
    g.restore();
    const dk = offscreen(w, h), d = dk.getContext('2d');
    d.drawImage(cv, 0, 0); d.globalCompositeOperation = 'source-atop'; d.fillStyle = 'rgba(40,0,30,0.42)'; d.fillRect(0, 0, w, h);
    return { lit: cv, dark: dk, w, h };
  }

  const ppSway = (t, j, k) => {
    const gust = bump(t, 0.75, 0.35, 0.2, 0.6) * (k === -1 ? 1 : 0.6) + bump(t, 5.9, 0.6, 0.7, 0.9);
    const calm = k === TITLE_ROW ? 1 - 0.75 * seg(t, 7.6, 8.8) : 1;
    return { th: (0.22 + 0.2 * Math.sin(t * 2.1 + j * 0.8 + k * 1.3)) * calm + 0.9 * gust * (0.7 + 0.3 * Math.sin(j * 1.7 + k)), sh: (0.1 * Math.sin(t * 1.7 + j * 1.1 + k)) * calm + 0.18 * gust * Math.sin(j + t * 3), rip: (1 + gust * 2) * calm, gust };
  };
  // one flag hung at (x,y) top-centre with pixel width w; warped in vertical strips
  function drawFlag(c, S, x, y, w, ang, t, j, k) {
    const h = w * FH / FW, sw = ppSway(t, j, k), ct = Math.max(0.3, Math.cos(sw.th));
    c.save(); c.translate(x, y); c.rotate(ang); c.transform(1, 0, sw.sh, 1, 0, 0); c.globalAlpha = 0.9;
    if (w < 46) { c.drawImage(S.lit, -w / 2, 0, w, h * ct); c.restore(); return; }
    const N = w > 300 ? 16 : 9, sx = S.w / N, dw = w / N;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N, ph = u * TAU * 1.15 - t * 5.2 + j * 1.3 + k;
      const hh = h * ct * (1 + 0.05 * sw.rip * Math.sin(ph)), x0 = -w / 2 + i * dw;
      c.drawImage(S.lit, i * sx, 0, sx, S.h, x0, 0, dw + 0.6, hh);
      const a = clamp(0.12 + 0.3 * Math.cos(ph) * sw.rip * 0.6 + (1 - ct) * 0.5);
      if (a > 0.03) { c.globalAlpha = a; c.drawImage(S.dark, i * sx, 0, sx, S.h, x0, 0, dw + 0.6, hh); c.globalAlpha = 0.9; }
    }
    c.restore();
  }

  MG.film({
    id: 'papelpicado', dur: 10, poster: 9.4,
    fonts: [['400 228px Ultra', 'PAPELICDO'], ['700 40px "Alegreya SC"', 'Día de Muertos · México'], ['italic 500 30px "Cormorant Garamond"', 'cut tissue paper']],
    meta: {
      family: 'I', name: 'Papel Picado', sub: 'Mexican Cut-Paper Banners', era: '19th c. —',
      origin: 'Artisans in Puebla towns such as San Salvador Huixcolotla chisel stacks of tissue paper into lace-like banners, strung over streets, altars and churchyards for fiestas and the Día de Muertos ofrendas. Pixar’s Coco and The Book of Life made its fluttering colour a global shorthand for Mexico.',
      works: 'Coco (Pixar, 2017) · The Book of Life (Reel FX, 2014) · San Salvador Huixcolotla papel picado workshops, Puebla · Día de Muertos ofrendas · Fiestas patrias street decorations',
      tech: ['Chisel-cut tissue lattice', 'Backlit translucency', 'Wind flutter & dolly under the rows'],
      accent: '#ff3d8b',
      motionDNA: 'A slow dolly under rows of banners that sway on sagging cords, each flag rippling and lifting in gusts, with marigold petals drifting through the light.',
      visualDNA: 'Hot pink, orange, purple, green and blue tissue cut into skulls, flowers, birds and lattice, glowing against a sunset sky, over candlelit streets and a marigold petal path.',
      transitions: 'Gust lifts a close-up flag away, dolly-through, petal storm, final banner settles to spell the title',
      implementation: ['Hand-chiselled tissue', 'Blender / Houdini cloth', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1102);
      const designs = ['calavera', 'flor', 'paloma', 'corazon'];
      const flags = [];
      for (let d = 0; d < 4; d++) for (let ci = 0; ci < 6; ci++) flags.push(makeFlag(designs[d], PPC[ci]));
      const letters = [...TITLE].map((ch, i) => (ch === ' ' ? makeFlag('flor', PPC[5]) : makeFlag('letter', PPC[[0, 1, 2, 3, 4, 6][i % 6]], ch)));
      const hero = makeFlag('calavera', PPC[0], null, 1300, Math.round(1300 * FH / FW), 0.5);
      // street: facades down both sides
      const fac = [];
      [-1, 1].forEach(side => {
        let z = -2;
        const cols = ['#d8517f', '#e09a3e', '#2f6fc0', '#c9533a', '#e6b83e', '#2fa39a', '#9b4fb0', '#e46a4a'];
        while (z < 95) { const len = 5 + r() * 5; fac.push({ side, z0: z, z1: z + len, h: 6.5 + r() * 4, col: cols[Math.floor(r() * cols.length)], lit: Array.from({ length: 12 }, () => r() < 0.55) }); z += len; }
      });
      const cand = [];
      for (let z = 1; z < 70; z += 1.1) [-1, 1].forEach(side => { if (r() < 0.8) cand.push([side * (3.3 + r() * 0.5), z + r() * 0.6, r() * 10]); });
      const carpet = Array.from({ length: 900 }, () => [(r() - 0.5) * 2.8, r() * 70, r() < 0.7 ? '#ff8c1a' : '#ffb21f', 0.6 + r() * 0.8]);
      const petals = Array.from({ length: 170 }, (_, i) => ({ t0: 1.2 + r() * 8.6, x: r() * 2200 - 140, z: r(), sp: r() * TAU, w: (r() - 0.5) * 7, col: r() < 0.6 ? '#ff8c1a' : (r() < 0.6 ? '#ffb020' : '#ff6a12') }));
      const glow = offscreen(128, 128), gg = glow.getContext('2d'), rg = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, 'rgba(255,200,110,0.9)'); rg.addColorStop(0.25, 'rgba(255,150,60,0.35)'); rg.addColorStop(1, 'rgba(255,120,40,0)'); gg.fillStyle = rg; gg.fillRect(0, 0, 128, 128);
      return { flags, letters, hero, fac, cand, carpet, petals, glow };
    },
    draw(c, t, W, H, st) {
      const zc = kf(t, [[0.7, 0], [1.6, 1.4, E.inQ], [7.2, 14.6, E.lin], [8.5, ZEND, E.outC]]);
      const camX = 0.12 * Math.sin(t * 0.6) * (1 - seg(t, 7.5, 8.6)), bob = 3 * Math.sin(t * 1.9) * (1 - seg(t, 7.5, 8.6));
      const P = (X, Y, Z) => { const d = Z - zc; if (d < 0.2) return null; const s = PF / d; return [W / 2 + (X - camX) * s, HZ - Y * s + bob, s, d]; };
      const dusk = seg(t, 0, 10);
      // sky
      const sky = c.createLinearGradient(0, 0, 0, HZ);
      sky.addColorStop(0, '#1d1348'); sky.addColorStop(0.32, '#55297a'); sky.addColorStop(0.58, '#c23d6f'); sky.addColorStop(0.8, '#ff7a3c'); sky.addColorStop(1, '#ffd479');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      const sunY = HZ - 70 + dusk * 30;
      const sg = c.createRadialGradient(W / 2, sunY, 0, W / 2, sunY, 700);
      sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.08, 'rgba(255,226,150,0.95)'); sg.addColorStop(0.3, 'rgba(255,150,80,0.35)'); sg.addColorStop(1, 'rgba(255,120,80,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
      // parroquia silhouette at the end of the street
      { const p = P(0, -1.6, 96); if (p) { const s = p[2], x = p[0], y = p[1];
        c.fillStyle = 'rgba(70,24,60,0.86)'; c.beginPath();
        c.rect(x - 9 * s, y - 14 * s, 18 * s, 14 * s);
        [-1, 1].forEach(sd => { c.rect(x + sd * 9 * s - 2.5 * s, y - 24 * s, 5 * s, 24 * s); c.moveTo(x + sd * 9 * s - 2.8 * s, y - 24 * s); c.lineTo(x + sd * 9 * s, y - 29 * s); c.lineTo(x + sd * 9 * s + 2.8 * s, y - 24 * s); });
        c.moveTo(x - 6 * s, y - 14 * s); c.quadraticCurveTo(x - 6 * s, y - 22 * s, x, y - 23 * s); c.quadraticCurveTo(x + 6 * s, y - 22 * s, x + 6 * s, y - 14 * s);
        c.fill(); c.fillRect(x - 0.3 * s, y - 27 * s, 0.6 * s, 4 * s);
      } }
      // street & marigold path
      const g0 = c.createLinearGradient(0, HZ, 0, H); g0.addColorStop(0, '#5a2a4a'); g0.addColorStop(0.2, '#3a1a36'); g0.addColorStop(1, '#1c0c1e');
      c.fillStyle = g0; c.fillRect(0, HZ - 1, W, H - HZ + 1);
      { const a = P(-1.4, -1.6, zc + 0.6), b = P(1.4, -1.6, zc + 0.6), e = P(0, -1.6, 300);
        if (a && b && e) { const pg = c.createLinearGradient(0, e[1], 0, H); pg.addColorStop(0, 'rgba(255,150,40,0.7)'); pg.addColorStop(1, 'rgba(230,100,20,0.85)'); c.fillStyle = pg; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(e[0], e[1]); c.lineTo(b[0], b[1]); c.closePath(); c.fill(); } }
      st.carpet.forEach(([X, Z, col, sz]) => { const p = P(X, -1.6, Z); if (!p || p[1] > H + 4) return; const s = p[2] * 0.05 * sz; c.fillStyle = col; c.fillRect(p[0] - s, p[1] - s * 0.4, s * 2, s * 0.8); });
      // facades, far to near
      const quad = (X, y0, y1, z0, z1) => { const q1 = P(X, y0, z0), q2 = P(X, y1, z0), q3 = P(X, y1, z1), q4 = P(X, y0, z1); if (!q1 || !q4) return null; c.beginPath(); c.moveTo(q1[0], q1[1]); c.lineTo(q2[0], q2[1]); c.lineTo(q3[0], q3[1]); c.lineTo(q4[0], q4[1]); c.closePath(); return [q1, q2, q3, q4]; };
      const facs = st.fac.filter(f => f.z1 > zc + 0.25).sort((a, b) => b.z0 - a.z0);
      facs.forEach(f => {
        const X = f.side * 6.5, z0 = Math.max(f.z0, zc + 0.25), z1 = f.z1, top = f.h - 1.6;
        const q = quad(X, -1.6, top, z0, z1); if (!q) return;
        const fog = clamp((f.z0 - zc) / 70);
        c.fillStyle = f.col; c.fill();
        const vg = c.createLinearGradient(0, Math.min(q[1][1], q[2][1]), 0, Math.max(q[0][1], q[3][1]));
        vg.addColorStop(0, `rgba(255,170,120,${0.18 * (1 - fog)})`); vg.addColorStop(0.25, 'rgba(60,14,50,0.25)'); vg.addColorStop(1, 'rgba(26,6,30,0.72)');
        c.fillStyle = vg; c.fill();
        c.fillStyle = `rgba(232,120,110,${fog * 0.7})`; c.fill();
        if (q[0][2] < 6) return;   // too far for detail
        const det = 1 - fog;
        // pilaster seam, plinth and cornice
        c.strokeStyle = `rgba(30,8,30,${0.6 * det})`; c.lineWidth = Math.max(1, q[0][2] * 0.08); c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.stroke();
        if (quad(X, -1.6, -1.0, z0, z1)) { c.fillStyle = `rgba(30,8,28,${0.45 * det})`; c.fill(); }
        if (quad(X, top - 0.45, top, z0, z1)) { c.fillStyle = `rgba(255,226,190,${0.32 * det})`; c.fill(); }
        let wi = 0;
        for (let wz = f.z0 + 1.0; wz < f.z1 - 1.2; wz += 2.3, wi++) {
          if (wz < zc + 0.3) continue;
          const lit = f.lit[wi % 12], lit2 = f.lit[(wi + 5) % 12];
          // ground floor: arched door or window with warm light
          if (quad(X, -1.6, 0.9, wz, wz + 1.1)) { c.fillStyle = lit ? `rgba(240,${140 + 30 * Math.sin(wi)},70,${0.7 * det + 0.1})` : 'rgba(24,8,26,0.85)'; c.fill(); }
          if (quad(X, 0.9, 1.15, wz - 0.12, wz + 1.22)) { c.fillStyle = `rgba(255,236,210,${0.4 * det})`; c.fill(); }
          // upper floor: trimmed window, shutters, iron balcony
          if (f.h > 5) {
            if (quad(X, 2.3, 4.3, wz - 0.12, wz + 1.22)) { c.fillStyle = `rgba(250,232,210,${0.38 * det})`; c.fill(); }
            if (quad(X, 2.45, 4.15, wz, wz + 1.1)) { c.fillStyle = lit2 ? `rgba(250,170,80,${0.7 * det + 0.1})` : `rgba(30,70,90,${0.9})`; c.fill(); }
            if (!lit2) { const m1 = P(X, 2.45, wz + 0.55), m2 = P(X, 4.15, wz + 0.55); if (m1 && m2) { c.strokeStyle = 'rgba(10,30,40,0.8)'; c.lineWidth = Math.max(1, m1[2] * 0.04); c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m2[0], m2[1]); c.stroke(); } }
            const b1 = P(X - f.side * 0.45, 2.3, wz - 0.25), b2 = P(X - f.side * 0.45, 2.3, wz + 1.35), b3 = P(X - f.side * 0.45, 3.0, wz - 0.25), b4 = P(X - f.side * 0.45, 3.0, wz + 1.35);
            if (b1 && b2 && b3 && b4) {
              c.strokeStyle = 'rgba(16,4,18,0.9)'; c.lineWidth = Math.max(1, b1[2] * 0.035); c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(b2[0], b2[1]); c.moveTo(b3[0], b3[1]); c.lineTo(b4[0], b4[1]);
              for (let i = 0; i <= 8; i++) { const u = i / 8; c.moveTo(lerp(b1[0], b2[0], u), lerp(b1[1], b2[1], u)); c.lineTo(lerp(b3[0], b4[0], u), lerp(b3[1], b4[1], u)); }
              c.stroke();
            }
          }
        }
      });
      // candles along the curbs
      c.globalCompositeOperation = 'lighter';
      st.cand.forEach(([X, Z, ph]) => {
        const p = P(X, -1.35, Z); if (!p || p[3] < 1.1 || p[1] > H + 40) return;
        const s = p[2], fl = 0.8 + 0.2 * vnoise(t * 7 + ph, ph) + 0.1 * vnoise(t * 17 + ph, 3);
        const gs = s * 0.9 * fl; c.globalAlpha = 0.5; c.drawImage(st.glow, p[0] - gs / 2, p[1] - gs / 2, gs, gs); c.globalAlpha = 1;
      });
      c.globalCompositeOperation = 'source-over';
      st.cand.forEach(([X, Z, ph]) => {
        const p = P(X, -1.35, Z); if (!p || p[3] < 1.1 || p[1] > H + 40) return;
        const s = p[2], fl = 0.8 + 0.2 * vnoise(t * 7 + ph, ph);
        c.fillStyle = '#f3e3c4'; c.fillRect(p[0] - s * 0.03, p[1], s * 0.06, s * 0.25);
        c.fillStyle = '#fff2c0'; c.beginPath(); ell(c, p[0] + vnoise(t * 5 + ph, 8) * s * 0.008, p[1] - s * 0.045 * fl, Math.max(0.8, s * 0.016), Math.max(1.2, s * 0.045 * fl), 0); c.fill();
      });
      // banner rows, far to near
      for (let k = ROWZ.length - 1; k >= 0; k--) {
        const Z = ROWZ[k], d = Z - zc; if (d < 0.35) continue;
        const title = k === TITLE_ROW, Yb = title ? 3.05 : 2.55 + (k % 2) * 0.25, sag = (title ? 0.22 : 0.55) + 0.06 * Math.sin(t * 1.6 + k);
        const Ys = X => Yb - sag * (1 - (X / 6.5) * (X / 6.5));
        // cord
        c.strokeStyle = 'rgba(255,240,220,0.75)'; c.lineWidth = Math.max(0.8, PF / d * 0.012); c.beginPath();
        for (let i = 0; i <= 24; i++) { const X = -6.5 + i / 24 * 13, p = P(X, Ys(X), Z); if (p) i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        c.stroke();
        const n = 12, pitch = title ? 0.665 : 13 / n, fw = pitch * (title ? 0.88 : 0.82);
        for (let j = 0; j < n; j++) {
          const X = -pitch * n / 2 + pitch * (j + 0.5), p = P(X, Ys(X), Z); if (!p) continue;
          const w = fw * p[2]; if (p[0] + w < -50 || p[0] - w > W + 50 || p[1] > H) continue;
          const slope = Math.atan2(-(Ys(X + 0.1) - Ys(X - 0.1)) * p[2], 0.2 * p[2]);
          const S = title ? st.letters[j] : st.flags[((j + k) % 4) * 6 + (j + k * 2) % 6];
          drawFlag(c, S, p[0], p[1], w, slope, t, j, k);
        }
      }
      // the opening close-up flag against the sun, lifted away by the first gust
      if (t < 1.6) {
        const wash = 1 - E.ioS(seg(t, 0.8, 1.35));
        if (wash > 0) {   // flare: the backlight swallows the street behind the close flag
          c.globalAlpha = wash; c.fillStyle = sky; c.fillRect(0, 0, W, H); c.fillStyle = sg; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
        }
        const lift = E.inQ(seg(t, 0.75, 1.5)), w = 1500 * (1 + lift * 0.2), h0 = w * FH / FW;
        c.save(); const fade = 1 - seg(t, 1.3, 1.55); c.globalAlpha = 0.94 * fade;
        c.translate(W / 2 + 30 + Math.sin(t * 1.7) * 12, -h0 * 0.49 + 560 - lift * 1500); c.rotate(Math.sin(t * 2.3) * 0.015 - lift * 0.12);
        const ct = Math.max(0.15, Math.cos(0.12 + lift * 1.2));
        const N = 24, sx = st.hero.w / N, dw = w / N;
        for (let i = 0; i < N; i++) {
          const u = (i + 0.5) / N, ph = u * TAU * 1.1 - t * 3.6 + 1;
          const hh = h0 * ct * (1 + 0.03 * Math.sin(ph) * (1 + lift * 3));
          c.globalAlpha = 0.94 * fade; c.drawImage(st.hero.lit, i * sx, 0, sx, st.hero.h, -w / 2 + i * dw, 0, dw + 1, hh);
          c.globalAlpha = clamp(0.08 + 0.2 * Math.cos(ph)) * fade; c.drawImage(st.hero.dark, i * sx, 0, sx, st.hero.h, -w / 2 + i * dw, 0, dw + 1, hh);
        }
        c.restore();
      }
      // sun bloom over everything (backlit tissue glows)
      const bl = c.createRadialGradient(W / 2, sunY, 0, W / 2, sunY, 900);
      bl.addColorStop(0, 'rgba(255,220,150,0.55)'); bl.addColorStop(0.35, 'rgba(255,140,90,0.16)'); bl.addColorStop(1, 'rgba(255,100,80,0)');
      c.globalCompositeOperation = 'screen'; c.fillStyle = bl; c.fillRect(0, 0, W, H);
      // a few rays
      c.globalAlpha = 0.018;
      for (let i = 0; i < 9; i++) { const a = -PI / 2 + (i - 4) * 0.28 + Math.sin(t * 0.3 + i) * 0.03; c.fillStyle = '#ffd9a0'; c.beginPath(); c.moveTo(W / 2, sunY); c.lineTo(W / 2 + Math.cos(a - 0.04) * 2000, sunY + Math.sin(a - 0.04) * 2000); c.lineTo(W / 2 + Math.cos(a + 0.04) * 2000, sunY + Math.sin(a + 0.04) * 2000); c.closePath(); c.fill(); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      // marigold petals in the air
      const gustX = bump(t, 5.9, 0.6, 0.7, 0.9);
      st.petals.forEach(p => {
        const age = t - p.t0; if (age < 0) return;
        const depth = 0.35 + p.z * 1.4, vy = 70 + 120 * depth;
        const x = p.x + age * (-30 + 60 * Math.sin(p.sp)) + Math.sin(age * 1.6 + p.sp) * 30 * depth + gustX * 380 * depth * Math.min(1, Math.max(0, t - 5.9)) , y = -40 + age * vy + Math.sin(age * 2 + p.sp) * 10;
        if (y > H + 30 || x < -60 || x > W + 60) return;
        const sz = 5 + 9 * depth, rot = p.sp + age * p.w, sq = Math.cos(age * 3 + p.sp);
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, Math.max(0.15, Math.abs(sq)));
        c.fillStyle = p.col; c.globalAlpha = depth > 1.4 ? 0.75 : 1;
        c.beginPath(); c.moveTo(-sz, 0); c.bezierCurveTo(-sz, -sz * 0.9, sz, -sz * 0.9, sz, 0); c.lineTo(sz * 0.6, sz * 0.25); c.lineTo(sz * 0.2, 0); c.lineTo(-sz * 0.2, sz * 0.25); c.lineTo(-sz * 0.6, 0); c.closePath(); c.fill();
        c.fillStyle = 'rgba(160,50,0,0.35)'; c.beginPath(); c.arc(0, sz * 0.05, sz * 0.25, 0, TAU); c.fill();
        c.restore();
      });
      c.globalAlpha = 1;
      // caption
      if (t > 8.4) {
        const a = E.outC(seg(t, 8.6, 9.3));
        c.save(); c.shadowColor = 'rgba(40,0,30,0.8)'; c.shadowBlur = 18;
        text(c, 'Día de Muertos  ·  México', W / 2, 432, { font: '"Alegreya SC"', weight: 700, size: 44, align: 'center', ls: 6, color: `rgba(255,236,200,${a})` });
        c.restore();
      }
      vignette(c, W, H, 0.5, '30,6,30');
      grain(c, W, H, t, 0.1, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.95;
      const B = 1.0, E8 = B / 6;                 // 6/8 bar = 1 s
      const jarana = (t, notes, g = 0.12, up = false) => (up ? [...notes].reverse() : notes).forEach((m, i) => A.pluck(t + i * 0.009, midi(m), { dur: 0.7, g, bright: 0.75, decay: 0.99, pan: -0.35 + i * 0.05, rev: 0.15 }));
      const guitarron = (t, m, g = 0.5) => A.pluck(t, midi(m), { dur: 1.2, g, bright: 0.35, decay: 0.996, lp: 700, rev: 0.1 });
      const requinto = (t, m, g = 0.22) => A.pluck(t, midi(m), { dur: 0.9, g, bright: 0.9, decay: 0.993, pan: 0.3, rev: 0.25 });
      const trumpet = (t, m, d, o = {}) => {
        const f = midi(m), g = o.g ?? 0.05;
        [[0, -0.4], [-6, 0.4]].forEach(([dt, pan], i) => {
          A.osc(t, { type: 'sawtooth', f: f * 0.985, f2: f, glide: 0.04, dur: d, g: g * (i ? 0.8 : 1), a: 0.025, hold: true, rel: 0.08, lp: 3200, q: 1.5, detune: dt, vib: [5.8, f * 0.006], rev: 0.3, pan });
        });
        if (o.third) A.osc(t, { type: 'sawtooth', f: midi(m - o.third), dur: d, g: g * 0.7, a: 0.025, hold: true, rel: 0.08, lp: 2800, q: 1.5, vib: [5.6, f * 0.006], rev: 0.3, pan: 0.15 });
      };
      const D = [50, 54, 57, 62, 66], G = [55, 59, 62, 67, 71], A7 = [52, 57, 61, 64, 67];
      // wind & paper
      A.noise(0, { type: 'bandpass', f: 700, q: 0.5, dur: 9.9, g: 0.03, hold: true, rel: 0.8 });
      A.whoosh(0.7, 0.9, { f1: 300, f2: 2500, g: 0.32 });
      A.bell(0.05, midi(50), { ratios: [1, 2.02, 2.76, 4.1], g: 0.06, dur: 3.5, rev: 0.7, pan: 0.2 });   // a distant church bell at dusk
      A.noise(0.0, { type: 'bandpass', f: 500, q: 0.4, dur: 1.4, g: 0.04, swell: 0.6, rev: 0.4 });
      [[0.34, 69], [0.5, 74], [0.67, 78], [0.84, 81]].forEach(([tt, m], i) => A.pluck(tt, midi(m), { dur: 0.9, g: 0.16 + i * 0.02, bright: 0.9, decay: 0.993, pan: 0.3, rev: 0.3 }));
      for (let i = 0; i < 26; i++) A.noise(0.75 + i * 0.03 + hash(i) * 0.02, { type: 'highpass', f: 3500 + hash(i + 3) * 3000, dur: 0.03, g: 0.05 + 0.05 * hash(i + 7), pan: hash(i + 1) - 0.5 });   // tissue flap
      for (let i = 0; i < 60; i++) A.noise(1.5 + hash(i * 2.1) * 8.2, { type: 'highpass', f: 4000 + hash(i) * 3000, dur: 0.02, g: 0.025, pan: hash(i + 4) - 0.5 });
      // son: guitarrón + jarana from bar 1 (t = 1.0)
      const prog = [D, D, G, A7, D, G, A7, D];
      for (let b = 0; b < 7; b++) {
        const t0 = 1.0 + b * B, ch = prog[b], root = ch[0] - 12;
        guitarron(t0, root, 0.45); guitarron(t0 + 3 * E8, ch[2] - 24 + 12, 0.32); if (b % 2) guitarron(t0 + 5 * E8, root + 7, 0.26);
        // sesquialtera accents: 1..2..|1.2.3.
        const acc = b % 2 ? [0, 2, 4] : [0, 3];
        for (let e = 0; e < 6; e++) jarana(t0 + e * E8, ch, acc.includes(e) ? 0.1 : 0.05, e % 2 === 1);
        A.noise(t0, { type: 'bandpass', f: 180, q: 1, dur: 0.12, g: 0.09 });               // zapateado on the tarima
        if (b % 2) A.noise(t0 + 2 * E8, { type: 'bandpass', f: 220, q: 1, dur: 0.1, g: 0.06 }); else A.noise(t0 + 3 * E8, { type: 'bandpass', f: 220, q: 1, dur: 0.1, g: 0.06 });
      }
      // requinto riff
      [[1.0, 74], [1.17, 78], [1.33, 81], [1.5, 78], [1.67, 74], [1.83, 76], [2.0, 78], [2.33, 74], [2.5, 71], [2.67, 69]].forEach(([tt, m]) => requinto(tt, m));
      // trumpets in thirds
      [[3.0, 81, 0.3], [3.33, 79, 0.15], [3.5, 78, 0.15], [3.67, 79, 0.3], [4.0, 81, 0.5], [4.66, 83, 0.3], [5.0, 81, 0.15], [5.17, 79, 0.15], [5.33, 78, 0.6]].forEach(([tt, m, d]) => trumpet(tt, m, d, { third: m === 83 ? 3 : 4 }));
      // the big gust: trumpets climb, petals storm
      A.whoosh(5.9, 1.6, { f1: 200, f2: 3000, g: 0.25 });
      A.noise(5.9, { type: 'bandpass', f: 1200, q: 0.4, dur: 1.8, g: 0.08, swell: 0.5 });
      for (let i = 0; i < 40; i++) A.noise(5.95 + i * 0.035, { type: 'highpass', f: 3000 + hash(i + 11) * 4000, dur: 0.03, g: 0.04 + 0.04 * hash(i), pan: hash(i + 2) - 0.5 });
      [[6.0, 86, 0.3], [6.33, 85, 0.15], [6.5, 83, 0.15], [6.67, 81, 0.3], [7.0, 83, 0.45], [7.5, 85, 0.4]].forEach(([tt, m, d]) => trumpet(tt, m, d, { third: 4, g: 0.055 }));
      // cadence: A7 → D, the classic mariachi button
      jarana(8.0, A7, 0.12); guitarron(8.0, 45, 0.5); trumpet(8.0, 85, 0.3, { third: 4 });
      jarana(8.33, A7, 0.1, true); trumpet(8.33, 88, 0.25, { third: 3 });
      jarana(8.6, [50, 54, 57, 62, 66, 69], 0.16); guitarron(8.6, 38, 0.6); trumpet(8.6, 86, 1.0, { third: 4, g: 0.06 });
      A.noise(8.6, { type: 'bandpass', f: 180, q: 1, dur: 0.18, g: 0.12 });
      A.bell(8.9, midi(50), { ratios: [1, 2.02, 2.76, 4.1], g: 0.07, dur: 4, rev: 0.6 });   // distant church bell
    },
  });
})();
