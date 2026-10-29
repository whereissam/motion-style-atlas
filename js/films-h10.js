/* batch h10 — Contemporary Social & Commercial Motion: Product Launch Film · Social Media Reels · Explainer Infographics.
   launch (keynote hardware reveal: teaser, macro details, hero reveal, spec slams, "Available now") ·
   reels (vertical short-form reposted inside a 16:9 frame) · explainer (2010s flat animated explainer). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;500;700;800&family=IBM+Plex+Mono:wght@500&family=Montserrat:wght@700;800;900&family=Inter:wght@500;600;700&family=Poppins:wght@500;600;700;800&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(u)))).join(',')})`; };
  const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  const heart = (g, x, y, s) => {
    g.beginPath();
    g.moveTo(x, y + s * 0.36);
    g.bezierCurveTo(x - s * 0.62, y - s * 0.04, x - s * 0.46, y - s * 0.56, x, y - s * 0.2);
    g.bezierCurveTo(x + s * 0.46, y - s * 0.56, x + s * 0.62, y - s * 0.04, x, y + s * 0.36);
    g.closePath();
  };
  // Stroke the first u of a polyline (draw-on lines and arrows); returns the tip point and heading.
  function drawOn(g, pts, u) {
    let L = 0; const d = [0];
    for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); d.push(L); }
    const tgt = L * clamp(u);
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    let tip = pts[0], ang = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (d[i] >= tgt) { const k = (tgt - d[i - 1]) / (d[i] - d[i - 1] || 1); tip = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; g.lineTo(tip[0], tip[1]); break; }
      g.lineTo(b[0], b[1]); tip = b;
    }
    g.stroke();
    return [tip, ang];
  }
  const qbez = (a, b, cc, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, v = 1 - u; return [v * v * a[0] + 2 * v * u * cc[0] + u * u * b[0], v * v * a[1] + 2 * v * u * cc[1] + u * u * b[1]]; });

  /* =====================================================================
     PRODUCT LAUNCH FILM — the keynote hardware reveal: a black stage,
     one line of light and a teaser line; three macro shots glide over
     brushed aluminium, speaker perforations and a backlit keyboard, each
     cut through black; the camera finds a sliver of light edge-on and
     swings round as the lid opens and the screen wakes, the one-word
     name rises beneath it; three spec beats slam in on hard cuts (edge,
     chip, battery) and the film signs off on "Available now"
     ===================================================================== */
  const LA = { bg: '#040405', ink: '#f5f5f7', mute: '#8b8b93', dim: '#2a2b31', alu: '#cfd2d9', aluD: '#17181c', blue: '#5b8cff', cyan: '#8fe6ff', violet: '#a98bff' };
  const LA_F = '"Inter Tight", sans-serif', LA_M = '"IBM Plex Mono", monospace';
  const LA_T = { tease: 0.3, teaseOut: 1.45, m1: 1.75, m2: 2.7, m3: 3.65, reveal: 4.6, name: 5.55, s1: 6.45, s2: 7.15, s3: 7.85, end: 8.6 };
  const LA_DV = { w: 1, d: 0.68, tb: 0.026, tl: 0.013, f: 4 };
  // box faces by corner bits (bit0 x, bit1 thickness, bit2 length)
  const LA_FACES = [['b0', [0, 1, 3, 2]], ['b1', [4, 5, 7, 6]], ['n0', [0, 1, 5, 4]], ['n1', [2, 3, 7, 6]], ['x0', [0, 2, 6, 4]], ['x1', [1, 3, 7, 5]]];
  const LA_LIGHT = (() => { const v = [-0.45, 0.8, 0.55], l = Math.hypot(...v); return v.map(x => x / l); })();

  // The fictional laptop: base slab + hinged lid, perspective-projected, faces culled and lit.
  // o: { x, y, S (px per unit width), yaw, pitch, lid (rad), on (screen 0..1), a }
  function laDev(c, o) {
    const { w, d, tb, tl, f } = LA_DV, hw = w / 2, hd = d / 2;
    const cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw), cp = Math.cos(o.pitch), sp = Math.sin(o.pitch);
    const cam = p => { const x1 = p[0] * cyw + p[2] * syw, z1 = -p[0] * syw + p[2] * cyw; return [x1, p[1] * cp - z1 * sp, z1 * cp + p[1] * sp]; };
    const scr = q => { const k = f / (f - q[2]); return [o.x + q[0] * k * o.S, o.y - q[1] * k * o.S]; };
    const P = p => scr(cam(p));
    const a = o.lid, Lv = [0, Math.sin(a), Math.cos(a)], Nv = [0, -Math.cos(a), Math.sin(a)];
    const lidPt = (x, s, n) => [x, tb + Lv[1] * s - Nv[1] * n, -hd + Lv[2] * s - Nv[2] * n];
    const basePt = (x, y, z) => [x, y, z];
    const baseC = [], lidC = [];
    for (let i = 0; i < 8; i++) {
      const bx = i & 1 ? hw : -hw;
      baseC.push(basePt(bx, i & 2 ? tb : 0, i & 4 ? hd : -hd));
      lidC.push(lidPt(bx, i & 4 ? d : 0, i & 2 ? tl : 0));
    }
    c.save(); c.globalAlpha = o.a ?? 1;
    // contact shadow
    const sc = P([0, 0, 0]);
    c.save(); c.translate(sc[0], sc[1] + 6); c.scale(1, 0.08 + 0.35 * Math.abs(sp));
    const sg = c.createRadialGradient(0, 0, 0, 0, 0, o.S * 0.62); sg.addColorStop(0, 'rgba(0,0,0,0.85)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(0, 0, o.S * 0.62, 0, TAU); c.fill(); c.restore();
    const drawBox = (corners, kind) => {
      const cc = corners.map(cam), bc = [0, 1, 2].map(j => cc.reduce((s, p) => s + p[j], 0) / 8);
      const vis = [];
      LA_FACES.forEach(([nm, idx]) => {
        const q = idx.map(i => cc[i]), fc = [0, 1, 2].map(j => (q[0][j] + q[1][j] + q[2][j] + q[3][j]) / 4);
        const n = [fc[0] - bc[0], fc[1] - bc[1], fc[2] - bc[2]], nl = Math.hypot(...n) || 1;
        if (n[0] * -fc[0] + n[1] * -fc[1] + n[2] * (f - fc[2]) <= 0) return;
        vis.push({ nm, q, fc, n: n.map(v => v / nl) });
      });
      vis.sort((A, B) => A.fc[2] - B.fc[2]);
      vis.forEach(F => {
        const pts = F.q.map(scr), lam = clamp(F.n[0] * LA_LIGHT[0] + F.n[1] * LA_LIGHT[1] + F.n[2] * LA_LIGHT[2]);
        poly(c, pts);
        const g = c.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
        g.addColorStop(0, mixc(LA.aluD, LA.alu, Math.pow(lam, 1.6) * 0.75)); g.addColorStop(1, mixc(LA.aluD, LA.alu, Math.pow(lam, 1.6) * 0.38));
        c.fillStyle = g; c.fill();
        c.strokeStyle = `rgba(230,236,255,${0.12 + 0.45 * lam})`; c.lineWidth = 1.2; c.stroke();
        if (kind === 'base' && F.nm === 'n1' && a > 0.25) {
          // keyboard well and trackpad on the deck
          const TP = (u, v) => P([-hw + u * w, tb, -hd + v * d]);
          poly(c, [TP(0.1, 0.08), TP(0.9, 0.08), TP(0.9, 0.5), TP(0.1, 0.5)]); c.fillStyle = 'rgba(8,8,10,0.85)'; c.fill();
          c.strokeStyle = rgba(LA.blue, 0.22 * (o.on ?? 0)); c.lineWidth = 1;
          for (let r = 1; r < 6; r++) { const v = lerp(0.08, 0.5, r / 6); const A = TP(0.1, v), B = TP(0.9, v); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
          for (let k = 1; k < 14; k++) { const u = lerp(0.1, 0.9, k / 14); const A = TP(u, 0.08), B = TP(u, 0.5); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
          poly(c, [TP(0.32, 0.58), TP(0.68, 0.58), TP(0.68, 0.93), TP(0.32, 0.93)]); c.fillStyle = 'rgba(255,255,255,0.06)'; c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke();
        }
        if (kind === 'lid' && F.nm === 'n0') {
          // the display: black glass, then the waking wallpaper inside the bezel
          const SP = (u, v) => P(lidPt(-hw + u * w, v * d, -0.0005));
          poly(c, pts); c.fillStyle = '#030304'; c.fill();
          const on = o.on ?? 0;
          if (on > 0.01) {
            const q = [SP(0.03, 0.04), SP(0.97, 0.04), SP(0.97, 0.96), SP(0.03, 0.96)];
            c.save(); poly(c, q); c.clip();
            const bgG = c.createLinearGradient(q[0][0], q[3][1], q[2][0], q[1][1]);
            bgG.addColorStop(0, mixc('#030304', '#0b1a4d', on)); bgG.addColorStop(1, mixc('#030304', '#1a0f3a', on));
            c.fillStyle = bgG; c.fill();
            const span = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
            [[0.32, 0.35, LA.blue, 0.9], [0.7, 0.6, LA.violet, 0.8], [0.5, 0.15, LA.cyan, 0.5]].forEach(([u, v, col, al]) => {
              const p = SP(u, v), rg = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], span * 0.45);
              rg.addColorStop(0, rgba(col, al * on)); rg.addColorStop(1, rgba(col, 0)); c.fillStyle = rg; c.fill();
            });
            // a glass ribbon across the wallpaper
            c.strokeStyle = `rgba(220,235,255,${0.35 * on})`; c.lineWidth = Math.max(1, span * 0.012);
            c.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30, p = SP(u, 0.5 + 0.2 * Math.sin(u * 5 + 1)); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
            c.restore();
          }
        }
      });
    };
    drawBox(baseC, 'base');
    drawBox(lidC, 'lid');
    // rim light along the front lip
    const r0 = P([-hw, tb, hd]), r1 = P([hw, tb, hd]);
    const rg = c.createLinearGradient(r0[0], r0[1], r1[0], r1[1]);
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.5, 'rgba(235,242,255,0.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = rg; c.lineWidth = 2; c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.stroke();
    c.restore();
    return P;
  }
  // Big glow behind the hero.
  function laGlow(c, x, y, r, col, a) {
    if (a <= 0) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function laLabel(c, s, a) {
    if (a <= 0) return;
    c.globalAlpha = a;
    text(c, s, 120, 985, { font: LA_M, weight: 500, size: 22, color: '#c4c8d4', ls: 5 });
    c.globalAlpha = 1;
  }

  function laTeaser(c, t) {
    const lu = E.outQt(seg(t, 0.1, 1.2)), out = E.inC(seg(t, LA_T.teaseOut, 1.72));
    const lw = 1150 * lu * (1 - out);
    if (lw > 2) {
      const g = c.createLinearGradient(960 - lw / 2, 0, 960 + lw / 2, 0);
      g.addColorStop(0, 'rgba(140,180,255,0)'); g.addColorStop(0.5, 'rgba(235,244,255,0.95)'); g.addColorStop(1, 'rgba(140,180,255,0)');
      c.fillStyle = g; c.fillRect(960 - lw / 2, 619, lw, 2);
      c.save(); c.translate(960, 620); c.scale(1, 0.07);
      const rg = c.createRadialGradient(0, 0, 0, 0, 0, lw * 0.6); rg.addColorStop(0, rgba(LA.blue, 0.35)); rg.addColorStop(1, rgba(LA.blue, 0));
      c.fillStyle = rg; c.beginPath(); c.arc(0, 0, lw * 0.6, 0, TAU); c.fill(); c.restore();
      // dust caught in the light
      for (let i = 0; i < 46; i++) {
        const x = 960 + (hash(i * 3.1) - 0.5) * lw, y = 620 + (hash(i * 5.7) - 0.5) * 160 - t * 14 * hash(i + 2), a = (1 - Math.abs(y - 620) / 90) * 0.5;
        if (a > 0) { c.fillStyle = `rgba(210,225,255,${a})`; c.fillRect(x, y, 2, 2); }
      }
    }
    const words = ['Our', 'thinnest', 'idea', 'yet.'];
    c.font = `300 76px ${LA_F}`;
    const ws = words.map(s => c.measureText(s).width), sp = 22, tw = ws.reduce((x, y) => x + y, 0) + sp * 3;
    let x = 960 - tw / 2;
    words.forEach((s, i) => {
      const u = E.outC(seg(t, LA_T.tease + i * 0.16, LA_T.tease + i * 0.16 + 0.55)), a = u * (1 - out);
      if (a > 0.01) {
        c.save(); c.globalAlpha = a; c.filter = `blur(${((1 - u) * 8).toFixed(1)}px)`;
        let col = LA.ink;
        if (i === 1) { col = c.createLinearGradient(x, 0, x + ws[i], 0); col.addColorStop(0, LA.cyan); col.addColorStop(1, LA.violet); }
        text(c, s, x, 560 + (1 - u) * 14, { font: LA_F, weight: i === 1 ? 500 : 300, size: 76, color: col });
        c.restore();
      }
      x += ws[i] + sp;
    });
  }

  function laMacroMetal(c, t, st) {
    const u = seg(t, LA_T.m1, LA_T.m2), gx = lerp(260, -260, E.ioS(u));
    c.save(); c.translate(960, 600); c.rotate(-0.16);
    // top surface: brushed grain under a soft overhead gradient
    c.drawImage(st.brush, -1500 + gx, -1000, 3000, 1000);
    const top = c.createLinearGradient(0, -1000, 0, 0);
    top.addColorStop(0, 'rgba(4,4,5,0.95)'); top.addColorStop(0.55, 'rgba(10,11,14,0.35)'); top.addColorStop(1, 'rgba(200,210,230,0.12)');
    c.fillStyle = top; c.fillRect(-1500, -1000, 3000, 1000);
    // diamond-cut chamfer and the side wall below it
    const ch = c.createLinearGradient(0, 0, 0, 30); ch.addColorStop(0, '#9da3ae'); ch.addColorStop(0.5, '#eef2f8'); ch.addColorStop(1, '#5c616b');
    c.fillStyle = ch; c.fillRect(-1500, 0, 3000, 30);
    const side = c.createLinearGradient(0, 30, 0, 700); side.addColorStop(0, '#3a3d44'); side.addColorStop(0.2, '#141519'); side.addColorStop(1, '#040405');
    c.fillStyle = side; c.fillRect(-1500, 30, 3000, 700);
    // the glint travelling along the chamfer
    const hx = lerp(-1100, 1100, E.ioC(u));
    c.save(); c.translate(hx, 15); c.scale(4, 0.35);
    const hg = c.createRadialGradient(0, 0, 0, 0, 0, 150); hg.addColorStop(0, 'rgba(255,255,255,0.95)'); hg.addColorStop(0.3, 'rgba(200,225,255,0.4)'); hg.addColorStop(1, 'rgba(160,200,255,0)');
    c.fillStyle = hg; c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fill(); c.restore();
    // a broad sheen sliding over the brushed top
    c.save(); c.globalCompositeOperation = 'lighter';
    const sx = lerp(900, -900, u), sh = c.createLinearGradient(sx - 420, 0, sx + 420, 0);
    sh.addColorStop(0, 'rgba(120,150,220,0)'); sh.addColorStop(0.5, 'rgba(120,150,220,0.16)'); sh.addColorStop(1, 'rgba(120,150,220,0)');
    c.fillStyle = sh; c.fillRect(-1500, -700, 3000, 700); c.restore();
    c.restore();
    // shallow depth of field: far edge falls off
    const dof = c.createLinearGradient(0, 0, 1920, 0); dof.addColorStop(0, 'rgba(0,0,0,0.55)'); dof.addColorStop(0.35, 'rgba(0,0,0,0)'); dof.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = dof; c.fillRect(0, 0, 1920, 1080);
    laLabel(c, 'PRECISION-CUT ALUMINIUM', E.outC(seg(t, LA_T.m1 + 0.2, LA_T.m1 + 0.5)));
  }

  function laMacroGrille(c, t) {
    const u = seg(t, LA_T.m2, LA_T.m3), camX = lerp(-0.22, 0.22, E.ioS(u)), dz = u * 0.3, F = 760;
    const bg = c.createLinearGradient(0, 260, 0, 1080); bg.addColorStop(0, '#060608'); bg.addColorStop(0.4, '#2a2d33'); bg.addColorStop(1, '#5d626b');
    c.fillStyle = bg; c.fillRect(0, 0, 1920, 1080);
    const sw = lerp(-300, 2200, u);
    const band = c.createLinearGradient(sw - 500, 0, sw + 500, 0);
    band.addColorStop(0, 'rgba(170,190,230,0)'); band.addColorStop(0.5, 'rgba(190,205,240,0.28)'); band.addColorStop(1, 'rgba(170,190,230,0)');
    c.fillStyle = band; c.fillRect(0, 260, 1920, 820);
    for (let r = 0; r < 44; r++) {
      const Z = 0.95 + r * 0.115 - dz;
      if (Z < 0.8) continue;
      const sy = 170 + 820 / Z, rad = 0.03 * F / Z, df = Math.abs(1 / Z - 1 / 1.75);
      const rr = rad + df * 22, al = clamp(1.1 - df * 2.2) * clamp((sy - 300) / 200);
      if (al <= 0.02 || rr < 0.8) continue;
      const off = (r & 1) * 0.05;
      for (let k = -30; k <= 30; k++) {
        const X = k * 0.1 + off, sx = 960 + (X - camX) * F / Z;
        if (sx < -30 || sx > 1950) continue;
        const lb = Math.exp(-Math.pow((sx - sw) / 420, 2));
        c.globalAlpha = al;
        c.fillStyle = '#070709'; c.beginPath(); c.ellipse(sx, sy, rr, rr * 0.62, 0, 0, TAU); c.fill();
        if (rad > 3) {
          c.strokeStyle = `rgba(220,230,255,${0.18 + 0.6 * lb})`; c.lineWidth = Math.max(1, rad * 0.16);
          c.beginPath(); c.ellipse(sx, sy, rr, rr * 0.62, 0, 0.15 * PI, 0.85 * PI); c.stroke();
        }
      }
    }
    c.globalAlpha = 1;
    const fade = c.createLinearGradient(0, 0, 0, 560); fade.addColorStop(0, 'rgba(4,4,5,1)'); fade.addColorStop(1, 'rgba(4,4,5,0)');
    c.fillStyle = fade; c.fillRect(0, 0, 1920, 560);
    laLabel(c, 'FOUR-SPEAKER ARRAY', E.outC(seg(t, LA_T.m2 + 0.2, LA_T.m2 + 0.5)));
  }

  const LA_KEYS = ['1234567890-=', 'QWERTYUIOP[]', 'ASDFGHJKL;\'', 'ZXCVBNM,./'];
  function laMacroKeys(c, t) {
    const u = seg(t, LA_T.m3, LA_T.reveal), camX = lerp(0.55, -0.15, E.ioS(u)), F = 900, bl = E.ioC(seg(t, LA_T.m3 + 0.15, LA_T.m3 + 0.55));
    c.fillStyle = '#08080a'; c.fillRect(0, 0, 1920, 1080);
    const proj = (X, Z) => [960 + (X - camX) * F / Z, 110 + 640 / Z];
    const ks = 0.165, pitch = 0.19;
    for (let r = LA_KEYS.length - 1; r >= 0; r--) {
      const Z = 0.8 + (LA_KEYS.length - 1 - r) * 0.2 + u * 0.06, row = LA_KEYS[r];
      for (let k = 0; k < row.length; k++) {
        const X = -1.1 + k * pitch + r * 0.05, Zf = Z + ks;
        const wk = ks;
        const q = [proj(X, Zf), proj(X + wk, Zf), proj(X + wk, Z), proj(X, Z)];
        if (q[2][0] < -50 || q[3][0] > 1970) continue;
        const df = Math.abs(1 / Z - 1 / 1.25), al = clamp(1.15 - df * 1.6);
        c.globalAlpha = al;
        // backlight bleeding around the cap
        if (bl > 0) {
          const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
          poly(c, q.map(p => [cx + (p[0] - cx) * 1.14, cy + (p[1] - cy) * 1.25]));
          c.fillStyle = rgba(LA.blue, 0.28 * bl); c.fill();
        }
        poly(c, q);
        const kg = c.createLinearGradient(0, q[0][1], 0, q[3][1]); kg.addColorStop(0, '#1d1e23'); kg.addColorStop(1, '#2c2e35');
        c.fillStyle = kg; c.lineJoin = 'round'; c.lineWidth = 0.035 * F / Z; c.strokeStyle = '#1f2026'; c.stroke(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q[3][0], q[3][1]); c.lineTo(q[2][0], q[2][1]); c.stroke();
        const ch = row[k];
        if (ch.trim()) {
          const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2, sx = (q[2][0] - q[3][0]) / 150, sy = (q[3][1] - q[0][1]) / 150;
          c.save(); c.translate(cx, cy); c.scale(sx, sy);
          text(c, ch, 0, 0, { font: LA_F, weight: 500, size: 52, align: 'center', base: 'middle', color: mixc('#55575f', '#e3ecff', bl) });
          c.restore();
        }
      }
    }
    c.globalAlpha = 1;
    laGlow(c, 960, 1100, 900, LA.blue, 0.12 * bl);
    laLabel(c, 'BACKLIT KEYBOARD', E.outC(seg(t, LA_T.m3 + 0.2, LA_T.m3 + 0.5)));
  }

  function laName(c, t, y, size, ls0) {
    const u = E.outQt(seg(t, LA_T.name + 0.25, LA_T.name + 1.0)), a = clamp(u * 1.4);
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.filter = `blur(${((1 - u) * 10).toFixed(1)}px)`;
    const ls = lerp(ls0, -size * 0.04, u);
    c.font = `800 ${size}px ${LA_F}`; if ('letterSpacing' in c) c.letterSpacing = ls + 'px';
    const tw = c.measureText('Kestrel').width; if ('letterSpacing' in c) c.letterSpacing = '0px';
    const g = c.createLinearGradient(960 - tw / 2, y - size, 960 + tw / 2, y);
    const sh = (t * 0.25) % 1;
    g.addColorStop(0, '#ffffff'); g.addColorStop(clamp(0.3 + sh * 0.4), LA.cyan); g.addColorStop(0.85, LA.violet); g.addColorStop(1, LA.blue);
    text(c, 'Kestrel', 960, y + (1 - u) * 40, { font: LA_F, weight: 800, size, align: 'center', color: g, ls });
    c.restore();
  }

  function laReveal(c, t) {
    const T = LA_T, in0 = E.outC(seg(t, T.reveal, T.reveal + 0.45));
    const sw = E.ioC(seg(t, T.reveal + 0.35, T.name + 0.45));
    const lid = lerp(0, 1.86, E.ioC(seg(t, T.reveal + 0.55, T.name + 0.55)));
    const mv = E.ioC(seg(t, T.name - 0.35, T.name + 0.55));
    const o = { x: 960, y: lerp(640, 600, mv), S: lerp(1250, 760, Math.max(sw * 0.35, mv)), yaw: lerp(PI / 2 - 0.02, 0.36, sw), pitch: lerp(0.0, 0.3, sw), lid, on: E.inQ(seg(t, T.reveal + 0.9, T.name + 0.4)), a: in0 };
    laGlow(c, 960, o.y - 220, 900, LA.blue, 0.22 * o.on);
    laGlow(c, 1150, o.y - 260, 600, LA.violet, 0.14 * o.on);
    laDev(c, o);
    // the first sliver: a rim of light where the edge catches the key
    const sl = 1 - seg(t, T.reveal + 0.5, T.reveal + 1.0);
    if (sl > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(960 - 420, 0, 960 + 420, 0);
      g.addColorStop(0, 'rgba(160,200,255,0)'); g.addColorStop(0.5, `rgba(230,240,255,${0.8 * in0 * sl})`); g.addColorStop(1, 'rgba(160,200,255,0)');
      c.fillStyle = g; c.fillRect(540, 638 - 16 * 1.25 - 26, 840, 3);
      c.restore();
    }
    laName(c, t, 930, 220, 60);
  }

  function laSlam(c, lt, s, x, y, size, o = {}) {
    const u = E.outQt(clamp(lt / 0.18)), a = clamp(lt / 0.05);
    const sc = (1 + 1.3 * (1 - u)) * (1 + 0.03 * clamp((lt - 0.18) / 0.6));
    c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(sc, sc);
    c.filter = `blur(${((1 - u) * 6).toFixed(1)}px)`;
    const g = c.createLinearGradient(0, -size, 0, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, o.col || '#c9d6ff');
    text(c, s, 0, 0, { font: LA_F, weight: 800, size, align: o.align || 'center', color: g, ls: -size * 0.04 });
    if (o.unit) { c.font = `800 ${size}px ${LA_F}`; const w = c.measureText(s).width - size * 0.04 * s.length; const ox = o.align === 'left' ? w : w / 2; text(c, o.unit, ox + 16, 0, { font: LA_F, weight: 500, size: size * 0.32, color: LA.mute }); }
    c.restore();
  }
  function laKicker(c, s, lt, x, y, align = 'center') {
    const a = E.outC(clamp((lt - 0.12) / 0.25));
    c.globalAlpha = a; text(c, s, x, y - (1 - a) * 10, { font: LA_M, weight: 500, size: 24, align, color: LA.cyan, ls: 6 }); c.globalAlpha = 1;
  }

  function laSpecs(c, t) {
    const T = LA_T, i = t < T.s2 ? 0 : t < T.s3 ? 1 : 2, t0 = [T.s1, T.s2, T.s3][i], lt = t - t0;
    // impact shake once the number lands
    const sh = Math.exp(-Math.max(0, lt - 0.18) * 16) * (lt > 0.18 ? 1 : 0);
    c.save(); c.translate(Math.sin(lt * 90) * 7 * sh, Math.cos(lt * 77) * 5 * sh);
    // a shock ring from the landing point
    const ring = (cx, cy) => { const r = lt - 0.18; if (r > 0 && r < 0.5) { c.strokeStyle = `rgba(160,190,255,${0.35 * (1 - r / 0.5)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy, 200 + r * 1500, 80 + r * 600, 0, 0, TAU); c.stroke(); } };
    if (i === 0) {
      laGlow(c, 960, 760, 800, LA.blue, 0.12);
      laDev(c, { x: 960 + lt * 40, y: 800, S: 1750, yaw: PI / 2 - 0.015, pitch: 0.02, lid: 0, on: 0 });
      const xe = 960 + lt * 40 + LA_DV.d / 2 * 1750 + 50, y0 = 800 - (LA_DV.tb + LA_DV.tl) * 1750 * 1.02, y1 = 802;
      const du = E.outC(clamp((lt - 0.2) / 0.3));
      c.strokeStyle = rgba(LA.cyan, du); c.lineWidth = 2;
      c.beginPath(); c.moveTo(xe - 30, y0); c.lineTo(xe + 30, y0); c.moveTo(xe - 30, y1); c.lineTo(xe + 30, y1); c.moveTo(xe, y0 - 50); c.lineTo(xe, y0); c.moveTo(xe, y1); c.lineTo(xe, y1 + 50); c.stroke();
      c.fillStyle = rgba(LA.cyan, du); [[y0, 1], [y1, -1]].forEach(([yy, s]) => { c.beginPath(); c.moveTo(xe, yy); c.lineTo(xe - 8, yy - s * 14); c.lineTo(xe + 8, yy - s * 14); c.fill(); });
      laKicker(c, 'THINNEST EDGE', lt, 960, 250);
      ring(960, 480);
      laSlam(c, lt, '11.2', 960, 560, 260, { unit: 'mm' });
    } else if (i === 1) {
      const cx = 600, cy = 540, s = 300, pu = clamp(lt / 0.5);
      laGlow(c, cx, cy, 520, LA.violet, 0.2);
      // traces leaving the die, light pulses running out along them
      for (let k = 0; k < 28; k++) {
        const side = k % 4, j = (k >> 2) - 3, off = j * 34;
        const st = side === 0 ? [cx + off, cy - s / 2] : side === 1 ? [cx + s / 2, cy + off] : side === 2 ? [cx + off, cy + s / 2] : [cx - s / 2, cy + off];
        const dir = [[0, -1], [1, 0], [0, 1], [-1, 0]][side], L1 = 60 + hash(k) * 80, L2 = 120 + hash(k + 9) * 200, bend = hash(k + 4) < 0.5 ? 1 : -1;
        const m = [st[0] + dir[0] * L1, st[1] + dir[1] * L1], e = [m[0] + (dir[0] || dir[1] * bend * 0.6) * L2 * 0.6 + dir[0] * L2 * 0.4, m[1] + (dir[1] || dir[0] * bend * 0.6) * L2 * 0.6 + dir[1] * L2 * 0.4];
        c.strokeStyle = 'rgba(150,160,200,0.25)'; c.lineWidth = 2; drawOn(c, [st, m, e], pu);
        const ph = (lt * 1.6 + hash(k + 2)) % 1;
        c.strokeStyle = rgba(k % 3 ? LA.cyan : LA.violet, 0.9 * pu); c.lineWidth = 3;
        c.save(); c.setLineDash([26, 400]); c.lineDashOffset = -ph * 420; c.beginPath(); c.moveTo(st[0], st[1]); c.lineTo(m[0], m[1]); c.lineTo(e[0], e[1]); c.stroke(); c.restore();
      }
      const cu = clamp(spring(lt, 2.2, 0.6), 0, 1.1);
      c.save(); c.translate(cx, cy); c.scale(cu, cu);
      rrect(c, -s / 2, -s / 2, s, s, 30); const dg = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); dg.addColorStop(0, '#2a2c34'); dg.addColorStop(1, '#0c0c10');
      c.fillStyle = dg; c.fill(); const bg = c.createLinearGradient(-s / 2, 0, s / 2, 0); bg.addColorStop(0, LA.cyan); bg.addColorStop(1, LA.violet);
      c.strokeStyle = bg; c.lineWidth = 3; c.stroke();
      text(c, 'K1', 0, 40, { font: LA_F, weight: 800, size: 120, align: 'center', color: '#eef2ff', ls: -4 });
      c.restore();
      laKicker(c, 'K1 CHIP', lt, 1000, 330, 'left');
      ring(1150, 520);
      laSlam(c, lt, '2×', 1000, 610, 280, { align: 'left', col: '#d9c9ff' });
      c.globalAlpha = E.outC(clamp((lt - 0.25) / 0.3)); text(c, 'faster graphics', 1004, 700, { font: LA_F, weight: 500, size: 46, color: LA.mute }); c.globalAlpha = 1;
    } else {
      const cx = 620, cy = 540, R = 200, fu = E.outQt(clamp(lt / 0.55));
      laGlow(c, cx, cy, 520, LA.cyan, 0.14);
      c.lineCap = 'round';
      c.strokeStyle = LA.dim; c.lineWidth = 30; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      const rg = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rg.addColorStop(0, LA.cyan); rg.addColorStop(1, LA.blue);
      c.strokeStyle = rg; c.beginPath(); c.arc(cx, cy, R, -PI / 2, -PI / 2 + TAU * 0.999 * fu); c.stroke();
      c.lineCap = 'butt';
      // battery glyph in the ring
      c.strokeStyle = '#e8eeff'; c.lineWidth = 6; rrect(c, cx - 70, cy - 34, 128, 68, 14); c.stroke();
      c.fillStyle = '#e8eeff'; rrect(c, cx + 64, cy - 14, 12, 28, 4); c.fill();
      c.fillStyle = rg; rrect(c, cx - 60, cy - 24, 108 * fu, 48, 8); c.fill();
      laKicker(c, 'BATTERY LIFE', lt, 1000, 330, 'left');
      ring(1250, 500);
      laSlam(c, lt, '22', 1000, 620, 300, { align: 'left', unit: 'hours', col: '#c6f1ff' });
    }
    c.restore();
  }

  function laEnd(c, t) {
    const T = LA_T, u = seg(t, T.end, 10), a = E.outC(seg(t, T.end, T.end + 0.35));
    const o = { x: 960, y: lerp(530, 505, E.outC(u)), S: lerp(700, 650, E.outC(u)), yaw: lerp(0.46, 0.3, E.ioS(u)), pitch: 0.27, lid: 1.86, on: 1, a };
    laGlow(c, 960, 330, 800, LA.blue, 0.18 * a);
    laGlow(c, 1150, 300, 520, LA.violet, 0.12 * a);
    laDev(c, o);
    const nu = E.outQt(seg(t, T.end + 0.15, T.end + 0.8));
    c.save(); c.globalAlpha = nu;
    const g = c.createLinearGradient(760, 0, 1160, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, LA.cyan); g.addColorStop(1, LA.violet);
    text(c, 'Kestrel', 960, 830 + (1 - nu) * 20, { font: LA_F, weight: 800, size: 128, align: 'center', color: g, ls: -5 });
    c.restore();
    const au = E.outC(seg(t, T.end + 0.5, T.end + 1.0));
    c.globalAlpha = au;
    text(c, 'Available now.', 960, 905 + (1 - au) * 12, { font: LA_F, weight: 500, size: 44, align: 'center', color: LA.ink });
    c.globalAlpha = au * 0.9;
    text(c, 'From $1,199', 960, 955, { font: LA_F, weight: 300, size: 28, align: 'center', color: LA.mute });
    c.globalAlpha = E.outC(seg(t, T.end + 0.8, T.end + 1.2)) * 0.9;
    text(c, 'PRODUCT LAUNCH FILM  ·  after keynote hardware reveals  ·  fictional product', 960, 1040, { font: LA_M, weight: 500, size: 17, align: 'center', color: '#c4c8d4', ls: 2 });
    c.globalAlpha = 1;
  }

  MG.film({
    id: 'launch', dur: 10, poster: 9.4,
    fonts: [['300 76px "Inter Tight"', 'Our thinnest idea yet.'], ['800 220px "Inter Tight"', 'Kestrel 11.2 2× 22'], ['500 44px "Inter Tight"', 'Available now. mm hours faster graphics'], ['500 20px "IBM Plex Mono"', 'PRECISION-CUT ALUMINIUM K1']],
    meta: {
      family: 'J', name: 'Product Launch', sub: 'The keynote reveal film', era: '2007 —',
      origin: 'The launch film is the short that plays when a company unveils new hardware on stage: darkness, a teaser line, slow macro shots over materials, then the product and its one-word name, a few specs and "available now". Apple’s Macworld and WWDC keynotes set the grammar in the late 2000s and every phone, laptop and headphone maker followed.',
      works: 'Apple Macworld keynotes: iPhone introduction (2007) and MacBook Air out of an envelope (2008) · Apple product films narrated by Jony Ive (2000s–2010s) · Apple “Think different” (TBWA\\Chiat\\Day, 1997) as the tone of the sign-off',
      tech: ['Teaser → macro → reveal', 'Edge-on to 3/4 hero swing', 'Spec slams on hard cuts'],
      accent: '#5b8cff',
      motionDNA: 'Editorial pacing is the motion: slow fades on the teaser, macro glides that never stop moving and cut through black, a single long swing from edge-on to three-quarter view as the lid opens, then a sudden switch to hard cuts where each spec slams in from scale with a small camera shake, before a calm sign-off.',
      visualDNA: 'A black stage and one cool blue–violet light; brushed aluminium, diamond-cut chamfers, speaker perforations and backlit keys shot macro with shallow focus; a waking screen as the only colour; huge tight-tracked grotesque numbers with small mono kickers.',
      transitions: 'Line of light into the teaser, dip-to-black between macro shots, sliver to hero swing, name rising from blur, hard cuts between spec beats, cut to the sign-off',
      implementation: ['Cinema 4D / Redshift product renders', 'After Effects editorial and type', 'Canvas 2D (projected box model)'],
      reproducibility: 'Fully procedural (fictional product, no real logos)',
      loopable: false,
    },
    setup() {
      // brushed aluminium: streaks of slightly lighter and darker grain
      const brush = offscreen(1024, 384), g = brush.getContext('2d'), r = rng(1010);
      g.fillStyle = '#7d828c'; g.fillRect(0, 0, 1024, 384);
      for (let i = 0; i < 3600; i++) {
        const y = r() * 384, x = r() * 1024, l = 60 + r() * 500, v = r();
        g.fillStyle = v < 0.5 ? `rgba(20,22,28,${0.05 + r() * 0.12})` : `rgba(235,240,250,${0.04 + r() * 0.12})`;
        g.fillRect(x - l / 2, y, l, 0.6 + r() * 0.9);
      }
      return { brush };
    },
    draw(c, t, W, H, st) {
      const T = LA_T;
      c.fillStyle = LA.bg; c.fillRect(0, 0, W, H);
      if (t < T.m1) laTeaser(c, t);
      else if (t < T.m2) laMacroMetal(c, t, st);
      else if (t < T.m3) laMacroGrille(c, t);
      else if (t < T.reveal) laMacroKeys(c, t);
      else if (t < T.s1) laReveal(c, t);
      else if (t < T.end) laSpecs(c, t);
      else laEnd(c, t);
      // the macro shots cut through black
      let dk = 0;
      [T.m1, T.m2, T.m3, T.reveal].forEach(d => { dk = Math.max(dk, 1 - Math.abs(t - d) / 0.13); });
      if (dk > 0) { c.fillStyle = `rgba(0,0,0,${clamp(dk)})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.035, 'overlay');
      vignette(c, W, H, 0.5);
    },
    score(A) {
      const T = LA_T;
      A.bus.gain.value = 0.85;
      // sub drone and an airy pad under the teaser and macro shots
      A.osc(0, { f: 41.2, dur: 4.6, g: 0.12, a: 1.2, hold: true, rel: 0.4 });
      A.chord(0.1, [52, 59, 64, 71], { type: 'triangle', dur: 4.5, g: 0.016, a: 1.4, hold: true, rel: 0.6, lp: 1400, spread: 7, width: 0.8, rev: 0.6 });
      // a soft note for each teaser word
      [71, 76, 78, 83].forEach((m, i) => A.pluck(T.tease + i * 0.16 + 0.05, midi(m), { g: 0.08, bright: 0.25, dur: 1.6, lp: 3000, rev: 0.55, pan: (i - 1.5) * 0.25 }));
      // macro shots: a whoosh into each, a glassy shimmer, a heartbeat that quickens
      [T.m1, T.m2, T.m3].forEach((t, i) => {
        A.whoosh(t - 0.12, 0.5, { f1: 200, f2: 3000, g: 0.06, pan: [-0.4, 0.4, 0][i] });
        A.bell(t + 0.15, midi([88, 90, 95][i]), { g: 0.03, dur: 1.4, rev: 0.7, pan: [-0.3, 0.3, 0][i] });
      });
      for (let t = 1.8, k = 0; t < T.reveal - 0.1; k++) { A.kick(t, 0.22 + k * 0.02, { f: 90, f2: 38, dur: 0.35 }); t += lerp(0.5, 0.25, (t - 1.8) / 2.8); }
      A.riser(3.7, 0.9, { g: 0.12, f: 110 });
      // the reveal: a held breath, then the swing and the name
      A.impact(T.reveal + 0.35, 0.45);
      A.whoosh(T.reveal + 0.4, 1.1, { f1: 150, f2: 2400, g: 0.08 });
      A.chord(T.reveal + 0.4, [40, 47, 52, 56, 59, 64], { type: 'sawtooth', dur: 1.9, g: 0.012, a: 0.6, hold: true, rel: 0.5, lp: 600, lp2: 3200, lpT: 1.2, spread: 8, width: 0.9, rev: 0.6 });
      A.bell(T.name, midi(76), { g: 0.07, dur: 2.2, rev: 0.6 });
      A.bell(T.name + 0.12, midi(83), { g: 0.05, dur: 2.2, rev: 0.6, pan: 0.3 });
      // spec slams: hit + sub + a stab
      [[T.s1, [52, 59, 64]], [T.s2, [54, 61, 66]], [T.s3, [56, 63, 68]]].forEach(([t, n]) => {
        A.whoosh(t - 0.14, 0.18, { f1: 800, f2: 5000, g: 0.06 });
        A.kick(t + 0.17, 0.7, { f: 140, f2: 40, dur: 0.5 });
        A.noise(t + 0.17, { type: 'lowpass', f: 3000, f2: 300, dur: 0.35, g: 0.12, rev: 0.4 });
        A.chord(t + 0.17, n, { type: 'sawtooth', dur: 0.5, g: 0.02, lp: 2400, lp2: 500, lpT: 0.4, spread: 9, width: 0.7, rev: 0.4 });
      });
      // sign-off: open major chord, rising bells
      A.chord(T.end, [52, 59, 64, 68, 71, 76], { type: 'triangle', dur: 1.45, g: 0.022, a: 0.25, hold: true, rel: 0.6, lp: 2600, spread: 6, width: 0.9, rev: 0.6 });
      A.osc(T.end, { f: 41.2, dur: 1.4, g: 0.1, a: 0.1, hold: true, rel: 0.5 });
      [76, 80, 83, 88].forEach((m, i) => A.bell(T.end + 0.5 + i * 0.12, midi(m), { g: 0.04, dur: 1.2, rev: 0.6, pan: (i - 1.5) * 0.3 }));
    },
  });

  /* =====================================================================
     SOCIAL MEDIA REELS — a vertical clip reposted on a 16:9 screen: the
     phone sits centred over a blurred, enlarged copy of itself; a creator
     talks to camera in jump cuts while auto-captions pop word by word,
     a "POV" text box, a "5 MIN" sticker and a "save this" arrow; matcha
     is whisked and poured, a double-tap sends a burst of hearts, the
     thumb swipes up to the next clip — a dusk skyline timelapse on a
     trending sound — and on the drop every window in the city lights
     ===================================================================== */
  const RE = { ui: '#ffffff', dim: 'rgba(255,255,255,0.78)', red: '#ff3b5c', yel: '#ffe14d', bg: '#08080a', skin: '#e9b792', hair: '#3a281f', sage: '#93b293', wall: '#eadcc8' };
  const RE_F = '"Inter", sans-serif', RE_C = 'Montserrat, sans-serif';
  const RE_T = { like: 5.3, swipe: 6.2, swipeEnd: 6.85, wait: 7.05, drop: 8.55, follow: 9.25 };
  const RE_PH = { x: 680, y: 42, w: 560, k: 560 / 540 };   // phone screen; content is 540 × 960 units
  const RE_SH = [{ t: 0, k: 'talk', z: 1.0, dx: 0, tilt: -0.03 }, { t: 1.3, k: 'talk', z: 1.34, dx: -26, tilt: 0.05 }, { t: 2.4, k: 'bowl' }, { t: 3.6, k: 'pour' }, { t: 4.7, k: 'talk', z: 1.12, dx: 18, tilt: 0.0, glass: true }];
  // auto-captions: groups of words with their onset times
  const RE_CAP_A = [[[0.15, 'okay'], [0.42, 'so'], [0.62, 'this'], [0.86, 'is']], [[1.35, 'my'], [1.58, 'five'], [1.85, 'minute']], [[2.5, 'iced'], [2.85, 'matcha']], [[3.65, 'that'], [3.92, 'changed'], [4.25, 'my']], [[4.75, 'whole'], [5.05, 'morning']], [[5.6, 'trust'], [5.85, 'me']]];
  const RE_CAP_B = [[[7.25, 'wait'], [7.55, 'for'], [7.85, 'it...']], [[RE_T.drop, 'THE'], [RE_T.drop + 0.2, 'LIGHTS']]];
  const RE_UA = { user: '@mira.makes', desc: 'my 5-min iced matcha  #morningroutine', sound: 'original sound  -  mira.makes', likes: ['48.2K', '48.3K'], com: '1,204', save: '9,876', share: '2,310', col: '#c98b6b' };
  const RE_UB = { user: '@city.hours', desc: 'golden hour to blue hour  #timelapse', sound: 'Neon Drive (sped up)  -  nightwave', likes: ['312K', '312K'], com: '4,518', save: '27.1K', share: '8,940', col: '#6b7bd9' };

  const reSpeaking = t => { for (const g of RE_CAP_A) for (const [w] of g) if (t > w && t < w + 0.24) return 1; return 0; };

  function reTalk(g, t, sh) {
    const lt = t - sh.t, jx = vnoise(t * 2.2, 3) * 4, jy = vnoise(t * 2.0, 5) * 4;
    g.save();
    g.translate(270 + jx, 470 + jy); g.scale(sh.z * (1 + 0.025 * lt), sh.z * (1 + 0.025 * lt)); g.translate(-270 + sh.dx, -470);
    // kitchen: warm wall, window light, a shelf
    const wg = g.createLinearGradient(0, 0, 540, 0); wg.addColorStop(0, '#f3e6d3'); wg.addColorStop(1, '#d6c0a5');
    g.fillStyle = wg; g.fillRect(-200, -200, 940, 1300);
    g.fillStyle = '#fff7e6'; g.fillRect(20, 110, 170, 300);
    g.fillStyle = '#e3d2b9'; g.fillRect(100, 110, 8, 300); g.fillRect(20, 255, 170, 8);
    const lg = g.createRadialGradient(110, 260, 0, 110, 260, 420); lg.addColorStop(0, 'rgba(255,246,220,0.75)'); lg.addColorStop(1, 'rgba(255,246,220,0)');
    g.fillStyle = lg; g.fillRect(-200, -200, 940, 1300);
    g.fillStyle = '#a7835f'; g.fillRect(360, 300, 240, 12);
    [[390, 268, '#5f8f5a'], [450, 275, '#d98c5f'], [505, 262, '#7aa36b']].forEach(([x, y, cl], i) => {
      g.fillStyle = i === 1 ? '#efe4d2' : '#c98f6a'; g.fillRect(x - 18, y, 36, 32);
      g.fillStyle = cl; g.beginPath(); g.arc(x, y - 6, i === 1 ? 14 : 26, 0, TAU); g.fill();
    });
    g.fillStyle = '#b98c66'; g.fillRect(-200, 820, 940, 300);
    // creator
    const sway = vnoise(t * 0.9, 11) * 0.04, sp = reSpeaking(t), mo = sp * (0.45 + 0.55 * Math.abs(Math.sin(t * 23)));
    g.fillStyle = RE.sage; g.beginPath(); g.ellipse(270, 900, 215, 230, 0, PI, TAU); g.fill(); g.fillRect(55, 900, 430, 200);
    g.fillStyle = '#d9a580'; g.fillRect(244, 560, 52, 90);
    g.save(); g.translate(270, 470); g.rotate(sh.tilt + sway);
    g.fillStyle = RE.hair; g.beginPath(); g.ellipse(0, -10, 112, 132, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, -138, 50, 0, TAU); g.fill();
    g.fillStyle = RE.skin; g.beginPath(); g.ellipse(0, 12, 90, 110, 0, 0, TAU); g.fill();
    g.fillStyle = RE.hair; g.beginPath(); g.ellipse(-20, -70, 86, 46, -0.35, PI * 0.95, TAU * 1.02); g.fill();
    const bl = (t % 2.7) < 0.1 ? 0.15 : 1;
    g.fillStyle = '#2a1d18'; [-33, 33].forEach(x => { g.beginPath(); g.ellipse(x, 0, 8.5, 11 * bl, 0, 0, TAU); g.fill(); });
    g.strokeStyle = '#3a281f'; g.lineWidth = 5; g.lineCap = 'round';
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 20, -28 - sp * 3); g.lineTo(s * 48, -32); g.stroke(); });
    g.fillStyle = 'rgba(230,120,110,0.28)'; [-52, 52].forEach(x => { g.beginPath(); g.arc(x, 36, 17, 0, TAU); g.fill(); });
    g.strokeStyle = '#c48a6c'; g.lineWidth = 3; g.beginPath(); g.arc(0, 26, 8, 0.2 * PI, 0.8 * PI); g.stroke();
    if (mo > 0.05) { g.fillStyle = '#7d3030'; g.beginPath(); g.ellipse(0, 60, 17, 4 + 15 * mo, 0, 0, TAU); g.fill(); }
    else { g.strokeStyle = '#8a3b36'; g.lineWidth = 4; g.beginPath(); g.arc(0, 48, 20, 0.2 * PI, 0.8 * PI); g.stroke(); }
    g.restore();
    // a gesturing hand, or the finished drink held up
    if (sh.glass) {
      const hy = 690 + Math.sin(t * 2) * 6;
      reGlass(g, 395, hy, 0.62, 1, t);
      g.fillStyle = RE.skin; g.beginPath(); g.ellipse(395, hy + 40, 54, 34, 0, 0, TAU); g.fill();
    } else {
      const gu = clamp(vnoise(t * 1.6, 21) * 1.4 + 0.3);
      if (gu > 0.05) { g.fillStyle = RE.skin; g.beginPath(); g.ellipse(410 - gu * 20, 900 - gu * 210, 40, 46, -0.3, 0, TAU); g.fill(); }
    }
    g.restore();
  }
  function reGlass(g, x, y, s, fill, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const top = -180, bot = 170, hw = 100;
    g.save(); g.beginPath(); g.moveTo(-hw, top); g.lineTo(hw, top); g.lineTo(hw * 0.88, bot); g.lineTo(-hw * 0.88, bot); g.closePath(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-hw, top, hw * 2, bot - top);
    g.fillStyle = '#f4efe4'; g.fillRect(-hw, lerp(bot, -20, 1), hw * 2, 400);
    const gh = 160 * fill, gy = -20 - gh;
    if (gh > 1) {
      const gg = g.createLinearGradient(0, gy, 0, -20 + 40); gg.addColorStop(0, '#6f9e2f'); gg.addColorStop(0.75, '#8fb84a'); gg.addColorStop(1, 'rgba(200,220,150,0)');
      g.fillStyle = gg; g.beginPath(); g.moveTo(-hw, -20 + 40);
      for (let k = 0; k <= 20; k++) { const xx = -hw + k * hw / 10; g.lineTo(xx, -20 + 22 * Math.sin(k * 0.9 + t * 4)); }
      g.lineTo(hw, gy); g.lineTo(-hw, gy); g.closePath(); g.fill();
    }
    [[-45, -110, 0.2], [30, -80, -0.3], [-10, -150, 0.5]].forEach(([ix, iy, r]) => {
      g.save(); g.translate(ix, iy); g.rotate(r); rrect(g, -30, -30, 60, 60, 10); g.fillStyle = 'rgba(255,255,255,0.32)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.stroke(); g.restore();
    });
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-hw, top); g.lineTo(-hw * 0.88, bot); g.lineTo(hw * 0.88, bot); g.lineTo(hw, top); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-hw + 14, top + 20, 10, bot - top - 50);
    g.restore();
  }
  function reBowl(g, t, sh) {
    const lt = t - sh.t, jx = vnoise(t * 2.5, 7) * 3;
    g.save(); g.translate(270 + jx, 470); g.rotate(lt * 0.05); g.scale(1 + lt * 0.03, 1 + lt * 0.03); g.translate(-270, -470);
    g.fillStyle = '#c9a27b'; g.fillRect(-200, -200, 940, 1300);
    g.strokeStyle = 'rgba(120,80,50,0.25)'; g.lineWidth = 3;
    for (let k = 0; k < 16; k++) { g.beginPath(); for (let x = -100; x <= 640; x += 40) { const y = -100 + k * 70 + Math.sin(x * 0.012 + k) * 14; x === -100 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(60,35,20,0.3)'; g.beginPath(); g.arc(290, 495, 200, 0, TAU); g.fill();
    g.fillStyle = '#efe8dc'; g.beginPath(); g.arc(270, 470, 195, 0, TAU); g.fill();
    g.fillStyle = '#d7cdbd'; g.beginPath(); g.arc(270, 470, 172, 0, TAU); g.fill();
    g.fillStyle = '#76a43a'; g.beginPath(); g.arc(270, 470, 160, 0, TAU); g.fill();
    // froth swirling under the whisk
    for (let k = 0; k < 70; k++) {
      const r = 20 + hash(k * 1.3) * 130, a0 = hash(k * 2.9) * TAU + lt * (3 + 3 * (1 - r / 160));
      g.strokeStyle = `rgba(200,225,130,${0.35 + hash(k) * 0.4})`; g.lineWidth = 2 + hash(k + 5) * 4;
      g.beginPath(); g.arc(270, 470, r, a0, a0 + 0.4 + hash(k + 8) * 0.8); g.stroke();
    }
    const wx = 270 + Math.sin(lt * 20) * 55, wy = 470 + Math.cos(lt * 9) * 18;
    g.strokeStyle = '#e6cc94'; g.lineWidth = 3;
    for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(wx + k * 8, wy - 30); g.quadraticCurveTo(wx + k * 13, wy + 15, wx + k * 6, wy + 40); g.stroke(); }
    g.strokeStyle = '#d6b072'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(wx, wy - 40); g.lineTo(wx + 230, wy - 430); g.stroke(); g.lineCap = 'butt';
    g.restore();
  }
  function rePour(g, t, sh) {
    const lt = t - sh.t, fill = E.outC(clamp(lt / 1.0));
    g.save(); g.translate(270, 470); g.scale(1.02 + lt * 0.03, 1.02 + lt * 0.03); g.translate(-270, -470);
    const wg = g.createLinearGradient(0, 0, 0, 960); wg.addColorStop(0, '#e9d9c3'); wg.addColorStop(1, '#cdb497');
    g.fillStyle = wg; g.fillRect(-200, -200, 940, 1300);
    g.fillStyle = 'rgba(255,250,235,0.5)'; g.beginPath(); g.ellipse(120, 200, 170, 220, 0, 0, TAU); g.fill();
    g.fillStyle = '#a77c58'; g.fillRect(-200, 740, 940, 400);
    g.fillStyle = 'rgba(60,35,20,0.22)'; g.beginPath(); g.ellipse(270, 745, 130, 18, 0, 0, TAU); g.fill();
    // the pitcher tips in from the top right and pours
    g.save(); g.translate(420, 150); g.rotate(-0.6 - 0.15 * Math.sin(lt * 3));
    rrect(g, -60, -70, 120, 150, 22); g.fillStyle = '#f1ece3'; g.fill(); g.restore();
    if (lt < 1.0) {
      g.strokeStyle = '#7fa93c'; g.lineWidth = 14 - lt * 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(352, 205); g.quadraticCurveTo(300, 260, 282 + Math.sin(lt * 20) * 3, 420); g.stroke(); g.lineCap = 'butt';
    }
    reGlass(g, 270, 560, 1.0, fill, t);
    g.restore();
  }
  function reClipA(g, t) {
    let sh = RE_SH[0]; RE_SH.forEach(s => { if (t >= s.t) sh = s; });
    if (sh.k === 'talk') reTalk(g, t, sh); else if (sh.k === 'bowl') reBowl(g, t, sh); else rePour(g, t, sh);
  }
  function reClipB(g, t, st) {
    const lt = t - RE_T.swipe, dr = E.ioC(seg(t, RE_T.drop - 0.2, RE_T.drop + 0.8));
    const punch = t > RE_T.drop ? 1 + 0.06 * Math.exp(-(t - RE_T.drop) * 5) : 1;
    g.save(); g.translate(270, 500); g.scale(punch, punch); g.translate(-270, -500);
    const sky = g.createLinearGradient(0, 0, 0, 760);
    sky.addColorStop(0, mixc('#3a2560', '#0b0d2a', dr)); sky.addColorStop(0.55, mixc('#e0668a', '#3a2a6a', dr)); sky.addColorStop(1, mixc('#ffb468', '#6a4a8a', dr));
    g.fillStyle = sky; g.fillRect(-100, -100, 740, 1100);
    // sun sinking fast (timelapse)
    const sy = 560 + lt * 40;
    const sg = g.createRadialGradient(330, sy, 0, 330, sy, 220); sg.addColorStop(0, rgba('#ffe2a0', 0.9 * (1 - dr))); sg.addColorStop(0.3, rgba('#ffc070', 0.5 * (1 - dr))); sg.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = sg; g.fillRect(-100, 200, 740, 700);
    g.fillStyle = rgba('#fff1c9', 1 - dr); g.beginPath(); g.arc(330, sy, 54, 0, TAU); g.fill();
    // timelapse clouds racing
    for (let k = 0; k < 7; k++) {
      const x = ((hash(k) * 900 + lt * (180 + hash(k + 3) * 220)) % 900) - 180, y = 90 + hash(k + 7) * 360;
      g.fillStyle = `rgba(255,${200 - dr * 120},${200 - dr * 80},${0.18 - dr * 0.08})`; g.beginPath(); g.ellipse(x, y, 140 + hash(k) * 60, 18, 0, 0, TAU); g.fill();
    }
    if (dr > 0) for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${dr * 0.7 * hash(k + 1)})`; g.fillRect(hash(k * 3.3) * 540, hash(k * 7.7) * 380, 2, 2); }
    // skyline: far layer then near layer, windows lighting in a sweep on the drop
    st.city.forEach(b => {
      g.fillStyle = b.far ? mixc('#4a3260', '#1c1838', dr) : mixc('#24183a', '#0c0a1c', dr);
      g.fillRect(b.x, 890 - b.h, b.w, b.h);
      if (b.far) return;
      b.win.forEach(([wx, wy, hs]) => {
        const on = clamp((t - RE_T.drop - (wx / 540) * 0.45 - hs * 0.25) / 0.08) * (hs > 0.12 && wy < 745 ? 1 : 0);
        g.fillStyle = on > 0 ? rgba(hs > 0.7 ? '#9fd8ff' : '#ffd27a', 0.25 + 0.75 * on) : 'rgba(255,200,140,0.07)';
        g.fillRect(wx, wy, 6, 9);
      });
    });
    g.fillStyle = mixc('#2a1a35', '#05050d', dr); g.fillRect(-100, 885, 740, 100);
    g.restore();
  }
  function reVideo(g, t, st) {
    const sw = E.ioC(seg(t, RE_T.swipe, RE_T.swipeEnd));
    if (sw < 1) { g.save(); g.translate(0, -sw * 890); reClipA(g, t); g.restore(); }
    if (sw > 0) { g.save(); g.translate(0, (1 - sw) * 890); reClipB(g, t, st); g.restore(); }
  }

  function reIcon(g, kind, x, y, red, pop) {
    g.save(); g.translate(x, y); g.scale(pop, pop);
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 6;
    g.fillStyle = red ? RE.red : '#fff';
    if (kind === 'heart') { heart(g, 0, 2, 50); g.fill(); }
    else if (kind === 'com') { g.beginPath(); g.ellipse(0, 0, 23, 20, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-10, 14); g.lineTo(-18, 27); g.lineTo(4, 18); g.fill(); g.fillStyle = '#333'; g.shadowBlur = 0; [-9, 0, 9].forEach(dx => { g.beginPath(); g.arc(dx, 0, 2.8, 0, TAU); g.fill(); }); }
    else if (kind === 'save') { g.beginPath(); g.moveTo(-16, -20); g.lineTo(16, -20); g.lineTo(16, 22); g.lineTo(0, 10); g.lineTo(-16, 22); g.closePath(); g.fill(); }
    else if (kind === 'share') { g.beginPath(); g.moveTo(20, -2); g.lineTo(2, -20); g.lineTo(2, -10); g.quadraticCurveTo(-20, -8, -22, 18); g.quadraticCurveTo(-10, 4, 2, 6); g.lineTo(2, 16); g.closePath(); g.fill(); }
    g.restore();
  }
  function reCaptions(g, t, groups) {
    let gi = -1;
    groups.forEach((gr, i) => { if (t >= gr[0][0] - 0.02) gi = i; });
    if (gi < 0) return;
    const gr = groups[gi], next = groups[gi + 1], last = gr[gr.length - 1][0];
    if (t > (next ? next[0][0] - 0.03 : last + 0.9)) return;
    const shown = gr.filter(([w]) => t >= w), cur = shown.length - 1, size = 40;
    g.font = `900 ${size}px ${RE_C}`;
    const words = gr.map(([, s]) => s.toUpperCase()), ws = words.map(s => g.measureText(s).width), sp = 14;
    const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1), fit = Math.min(1, 380 / tw);
    g.save(); g.translate(240, 610); g.scale(fit, fit); g.translate(-240, -610);
    let x = 240 - tw / 2;
    words.forEach((s, i) => {
      if (i <= cur) {
        const pu = E.outB(clamp((t - gr[i][0]) / 0.14)), act = i === cur;
        g.save(); g.translate(x + ws[i] / 2, 610); g.scale(act ? 0.6 + 0.48 * pu : 1, act ? 0.6 + 0.48 * pu : 1); g.rotate(act ? -0.03 : 0);
        text(g, s, 0, 0, { font: RE_C, weight: 900, size, align: 'center', base: 'middle', color: act ? RE.yel : '#fff', stroke: '#000', lw: 9 });
        g.restore();
      }
      x += ws[i] + sp;
    });
    g.restore();
  }
  // TikTok-style text box: each line on its own white rounded plate.
  function reTextBox(g, lines, x, y, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = clamp(a); g.translate(x, y); g.scale(s, s);
    lines.forEach((ln, i) => {
      g.font = `700 30px ${RE_F}`; const w = g.measureText(ln).width + 28;
      rrect(g, -w / 2, i * 46 - 22, w, 44, 10); g.fillStyle = '#fff'; g.fill();
      text(g, ln, 0, i * 46 + 1, { font: RE_F, weight: 700, size: 30, align: 'center', base: 'middle', color: '#111' });
    });
    g.restore();
  }
  function reSticker5(g, t, x, y, a) {
    if (a <= 0) return;
    const s = E.outB(clamp(a)), wob = Math.sin(t * 6) * 0.05;
    g.save(); g.translate(x, y); g.rotate(0.22 + wob); g.scale(s, s);
    g.beginPath(); for (let k = 0; k < 28; k++) { const r = k % 2 ? 58 : 72, an = k / 28 * TAU; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath();
    g.fillStyle = RE.yel; g.fill(); g.strokeStyle = '#111'; g.lineWidth = 4; g.stroke();
    text(g, '5 MIN', 0, -4, { font: RE_C, weight: 900, size: 30, align: 'center', base: 'middle', color: '#111' });
    text(g, 'RECIPE', 0, 24, { font: RE_C, weight: 800, size: 14, align: 'center', base: 'middle', color: '#111', ls: 2 });
    g.restore();
  }
  function reClipUI(g, t, U, liked, prog, followed) {
    // scrims for legibility
    const bs = g.createLinearGradient(0, 600, 0, 890); bs.addColorStop(0, 'rgba(0,0,0,0)'); bs.addColorStop(0.45, 'rgba(0,0,0,0.3)'); bs.addColorStop(1, 'rgba(0,0,0,0.72)');
    g.fillStyle = bs; g.fillRect(0, 600, 540, 290);
    // right rail
    const rx = 492;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(rx, 430, 27, 0, TAU); g.fill();
    g.fillStyle = U.col; g.beginPath(); g.arc(rx, 430, 24, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(rx, 424, 9, 0, TAU); g.fill(); g.beginPath(); g.ellipse(rx, 446, 14, 9, 0, PI, TAU); g.fill();
    const fp = followed > 0 ? E.outB(clamp(followed / 0.25)) : 0;
    g.save(); g.translate(rx, 458); g.scale(1 + 0.25 * Math.sin(clamp(followed / 0.25) * PI), 1 + 0.25 * Math.sin(clamp(followed / 0.25) * PI));
    g.fillStyle = followed > 0 ? '#fff' : RE.red; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
    g.strokeStyle = followed > 0 ? RE.red : '#fff'; g.lineWidth = 3; g.beginPath();
    if (followed > 0) { g.moveTo(-5 * fp, 0); g.lineTo(-1, 4); g.lineTo(6 * fp, -4); } else { g.moveTo(-5, 0); g.lineTo(5, 0); g.moveTo(0, -5); g.lineTo(0, 5); }
    g.stroke(); g.restore();
    const lp = liked > 0 ? 1 + 0.35 * Math.sin(clamp(liked / 0.3) * PI) : 1;
    [['heart', 520, liked > 0 ? U.likes[1] : U.likes[0]], ['com', 598, U.com], ['save', 676, U.save], ['share', 754, U.share]].forEach(([k, y, n]) => {
      reIcon(g, k, rx, y, k === 'heart' && liked > 0, k === 'heart' ? lp : 1);
      text(g, n, rx, y + 44, { font: RE_F, weight: 600, size: 15, align: 'center', color: '#fff' });
    });
    // spinning sound disc
    g.save(); g.translate(rx, 838); g.rotate(t * 2.4);
    g.fillStyle = '#222'; g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.fill();
    g.strokeStyle = '#444'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.stroke();
    g.fillStyle = U.col; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
    g.restore();
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.7 + k * 0.5) % 1;
      g.globalAlpha = Math.sin(ph * PI) * 0.8;
      text(g, '♪', rx - 18 - ph * 30, 830 - ph * 50, { font: RE_F, weight: 700, size: 20, color: '#fff' });
    }
    g.globalAlpha = 1;
    // caption block
    text(g, U.user, 18, 772, { font: RE_F, weight: 700, size: 22, color: '#fff' });
    text(g, U.desc, 18, 806, { font: RE_F, weight: 500, size: 17, color: RE.dim });
    // sound row with a live waveform and marquee
    for (let k = 0; k < 5; k++) { const h = 4 + 10 * Math.abs(Math.sin(t * 9 + k * 1.7)); g.fillStyle = '#fff'; g.fillRect(18 + k * 5, 845 - h, 3, h); }
    g.save(); g.beginPath(); g.rect(50, 822, 300, 34); g.clip();
    g.font = `500 16px ${RE_F}`; const mw = g.measureText(U.sound).width + 60, mx = 50 - ((t * 40) % mw);
    [0, 1].forEach(i => text(g, U.sound, mx + i * mw, 846, { font: RE_F, weight: 500, size: 16, color: '#fff' }));
    g.restore();
    // progress bar
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(0, 886, 540, 4);
    g.fillStyle = '#fff'; g.fillRect(0, 886, 540 * clamp(prog), 4);
  }
  function reChrome(g, t) {
    // status bar, tabs
    const ts = g.createLinearGradient(0, 0, 0, 150); ts.addColorStop(0, 'rgba(0,0,0,0.4)'); ts.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ts; g.fillRect(0, 0, 540, 150);
    text(g, '9:41', 40, 30, { font: RE_F, weight: 600, size: 17, color: '#fff' });
    [0, 1, 2, 3].forEach(k => { g.fillStyle = '#fff'; g.fillRect(430 + k * 6, 26 - k * 3, 4, 4 + k * 3); });
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; rrect(g, 462, 16, 34, 15, 4); g.stroke(); g.fillStyle = '#fff'; g.fillRect(465, 19, 22, 9);
    text(g, 'Following', 205, 84, { font: RE_F, weight: 600, size: 20, align: 'center', color: 'rgba(255,255,255,0.65)' });
    text(g, 'For You', 320, 84, { font: RE_F, weight: 700, size: 21, align: 'center', color: '#fff' });
    g.fillStyle = '#fff'; g.fillRect(304, 94, 32, 3);
    text(g, 'LIVE', 30, 84, { font: RE_F, weight: 700, size: 15, color: '#fff' });
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(500, 77, 9, 0, TAU); g.moveTo(507, 84); g.lineTo(514, 91); g.stroke();
    // bottom navigation
    g.fillStyle = '#000'; g.fillRect(0, 890, 540, 70);
    const nx = [54, 162, 270, 378, 486];
    ['Home', 'Friends', '', 'Inbox', 'Profile'].forEach((s, i) => {
      if (i === 2) { rrect(g, 270 - 28, 905, 56, 34, 10); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#000'; g.fillRect(268, 912, 4, 20); g.fillRect(260, 920, 20, 4); return; }
      g.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,0.7)'; g.strokeStyle = g.fillStyle; g.lineWidth = 2.5;
      if (i === 0) { poly(g, [[nx[i] - 12, 922], [nx[i], 910], [nx[i] + 12, 922], [nx[i] + 12, 934], [nx[i] - 12, 934]]); g.fill(); }
      else if (i === 1) { g.beginPath(); g.arc(nx[i] - 5, 917, 6, 0, TAU); g.arc(nx[i] + 8, 919, 5, 0, TAU); g.stroke(); }
      else if (i === 3) { rrect(g, nx[i] - 12, 910, 24, 20, 4); g.stroke(); }
      else { g.beginPath(); g.arc(nx[i], 915, 6, 0, TAU); g.stroke(); g.beginPath(); g.arc(nx[i], 934, 11, PI, TAU); g.stroke(); }
      text(g, s, nx[i], 952, { font: RE_F, weight: 600, size: 11, align: 'center', color: g.fillStyle });
    });
  }
  function reHearts(g, t) {
    [[RE_T.like, 220, 400, -0.25, 1], [RE_T.like + 0.17, 300, 350, 0.22, 0.85]].forEach(([t0, x, y, r, s0], i) => {
      const lt = t - t0;
      if (lt < 0 || lt > 0.9) return;
      const s = E.outB(clamp(lt / 0.2), 2.6) * s0, rise = E.inQ(clamp((lt - 0.4) / 0.5)), a = 1 - rise;
      g.save(); g.globalAlpha = a; g.translate(x, y - rise * 140); g.rotate(r); g.scale(s * (1 + rise * 0.5), s * (1 + rise * 0.5));
      const hg = g.createLinearGradient(0, -60, 0, 60); hg.addColorStop(0, '#ff6b81'); hg.addColorStop(1, '#ff2a4f');
      g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 16; heart(g, 0, 0, 150); g.fillStyle = hg; g.fill();
      g.restore();
      if (i === 0 && lt < 0.6) {
        g.strokeStyle = `rgba(255,255,255,${0.6 * (1 - lt / 0.6)})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 20 + lt * 200, 0, TAU); g.stroke();
        for (let k = 0; k < 9; k++) {
          const an = k / 9 * TAU + 0.3, d = E.outC(clamp(lt / 0.5)) * 130;
          g.globalAlpha = 1 - clamp(lt / 0.6); g.fillStyle = k % 2 ? RE.red : '#ff8fa3';
          heart(g, x + Math.cos(an) * d, y + Math.sin(an) * d, 22); g.fill();
        }
        g.globalAlpha = 1;
      }
    });
  }
  function reTrend(g, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.translate(18, 128);
    rrect(g, 0, 0, 220, 40, 20); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fill();
    for (let k = 0; k < 9; k++) { const h = 6 + 18 * Math.abs(Math.sin(t * 7 + k * 0.9) * Math.sin(t * 2.3 + k)); g.fillStyle = RE.yel; g.fillRect(16 + k * 6, 20 - h / 2, 3.5, h); }
    text(g, 'Trending sound', 82, 26, { font: RE_F, weight: 700, size: 16, color: '#fff' });
    g.restore();
  }

  MG.film({
    id: 'reels', dur: 10, poster: 5.5,
    fonts: [['900 44px Montserrat', 'OKAY SO THIS IS MY FIVE MINUTE ICED MATCHA THAT CHANGED WHOLE MORNING TRUST ME WAIT FOR IT... THE LIGHTS 5 MIN RECIPE'], ['700 30px Inter', 'POV: you finally fixed your mornings @mira.makes'], ['500 17px Inter', 'my 5-min iced matcha #morningroutine original sound 9:41 ♪'], ['600 20px Inter', 'Following For You 48.2K']],
    meta: {
      family: 'J', name: 'Social Reels', sub: 'Vertical short-form video', era: '2013 —',
      origin: 'Short-form vertical video — Vine’s six-second loops, then Musical.ly, TikTok, Instagram Reels and YouTube Shorts — built a new editing grammar for the phone held upright: jump cuts every second, captions that pop word by word, stickers and text boxes, and a swipe to the next clip. Reposted onto 16:9 screens, the tall frame sits in the middle over a blurred, enlarged copy of itself.',
      works: 'Vine (2013–2017) · Musical.ly (2014) · Douyin (2016) and TikTok (2017 —) · Instagram Reels (2020) · YouTube Shorts (2020 —) · CapCut auto-captions (2020s)',
      tech: ['Jump cuts and punch-ins', 'Word-by-word auto-captions', 'Pillarbox blur fill'],
      accent: '#ff3b5c',
      motionDNA: 'Nothing holds longer than a second: jump cuts snap between framings of the same talking head, each caption word pops with overshoot as it is spoken, stickers bounce on, a double-tap throws a heart that springs, wobbles and floats away, and the whole clip is thrown upward by a thumb swipe so the next one can drop on the beat.',
      visualDNA: 'A 9:16 phone screen centred in the 16:9 frame over its own blurred enlargement; handheld, warmly lit selfie footage; heavy white caption type with black outlines and one yellow word; white text plates, a yellow starburst, red hearts, a translucent action rail, a thin progress bar and a generic app chrome.',
      transitions: 'Jump cuts and punch-ins on the talking head, hard cuts to B-roll, double-tap heart burst, swipe-up to the next clip, beat-drop zoom punch',
      implementation: ['CapCut / TikTok in-app editor', 'Premiere Pro or Final Cut (vertical timeline)', 'Canvas 2D (low-res blur fill)'],
      reproducibility: 'Fully procedural (generic app UI, fictional creators, no real logos)',
      loopable: false,
    },
    setup() {
      // the skyline for clip B: a far layer and a near layer with window grids
      const r = rng(4242), city = [];
      for (let x = -20; x < 560; x += 40 + r() * 40) city.push({ far: true, x, w: 50 + r() * 50, h: 260 + r() * 260, win: [] });
      for (let x = -10; x < 560;) {
        const w = 56 + r() * 64, h = 160 + r() * 380, b = { far: false, x, w, h, win: [] };
        for (let wy = 890 - h + 16; wy < 870; wy += 18) for (let wx = x + 8; wx < x + w - 12; wx += 13) b.win.push([wx, wy, r()]);
        city.push(b); x += w + 4 + r() * 10;
      }
      return { city, small: offscreen(54, 89) };
    },
    draw(c, t, W, H, st) {
      const P = RE_PH, sh = 960 * P.k;
      // pillarbox fill: the same video, tiny, stretched to cover and dimmed
      const sg = st.small.getContext('2d');
      sg.setTransform(0.1, 0, 0, 0.1, 0, 0); reVideo(sg, t, st);
      c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      const fh = 1920 * 89 / 54; c.drawImage(st.small, -40, 540 - fh * 0.42, 2000, fh); c.restore();
      c.fillStyle = 'rgba(0,0,0,0.42)'; c.fillRect(0, 0, W, H);
      vignette(c, W, H, 0.5);
      // the phone
      c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 60; c.shadowOffsetY = 20;
      rrect(c, P.x - 16, P.y - 16, P.w + 32, sh + 32, 70); c.fillStyle = '#0c0c0e'; c.fill(); c.restore();
      rrect(c, P.x - 16, P.y - 16, P.w + 32, sh + 32, 70); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; c.stroke();
      c.save(); rrect(c, P.x, P.y, P.w, sh, 56); c.clip();
      c.translate(P.x, P.y); c.scale(P.k, P.k);
      c.fillStyle = RE.bg; c.fillRect(0, 0, 540, 960);
      c.save(); c.beginPath(); c.rect(0, 0, 540, 890); c.clip();
      reVideo(c, t, st);
      const sw = E.ioC(seg(t, RE_T.swipe, RE_T.swipeEnd));
      // clip A overlays
      if (sw < 1) {
        c.save(); c.translate(0, -sw * 890);
        reTextBox(c, ['POV: you finally', 'fixed your mornings'], 260, 210, E.outC(seg(t, 0.05, 0.25)) * (1 - seg(t, 2.3, 2.4)), E.outB(seg(t, 0.05, 0.3)));
        reSticker5(c, t, 400, 210, seg(t, 2.45, 2.7) * (t < 3.6 ? 1 : 0));
        const sv = seg(t, 3.75, 3.95) * (t < 4.7 ? 1 : 0);
        if (sv > 0) {
          reTextBox(c, ['save this for', 'tomorrow'], 200, 220, sv, E.outB(sv));
          c.save(); c.globalAlpha = sv; c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
          const [tip, an] = drawOn(c, qbez([300, 280], [455, 660], [470, 330]), E.outC(seg(t, 3.85, 4.3)));
          c.beginPath(); c.moveTo(tip[0] - Math.cos(an - 0.5) * 20, tip[1] - Math.sin(an - 0.5) * 20); c.lineTo(tip[0], tip[1]); c.lineTo(tip[0] - Math.cos(an + 0.5) * 20, tip[1] - Math.sin(an + 0.5) * 20); c.stroke();
          c.restore();
        }
        reCaptions(c, t, RE_CAP_A);
        reClipUI(c, t, RE_UA, t - RE_T.like, t / 6.6, 0);
        reHearts(c, t);
        c.restore();
      }
      if (sw > 0) {
        c.save(); c.translate(0, (1 - sw) * 890);
        reTrend(c, t, E.outC(seg(t, RE_T.swipeEnd, RE_T.swipeEnd + 0.3)));
        reCaptions(c, t, RE_CAP_B);
        reClipUI(c, t, RE_UB, 0, (t - RE_T.swipe) / 3.9, t - RE_T.follow);
        c.restore();
      }
      // the thumb dragging up
      const fu = seg(t, RE_T.swipe - 0.12, RE_T.swipeEnd - 0.1);
      if (fu > 0 && fu < 1) {
        const fy = lerp(760, 300, E.ioC(fu));
        c.fillStyle = `rgba(255,255,255,${0.35 * Math.sin(fu * PI)})`; c.beginPath(); c.arc(320, fy, 34, 0, TAU); c.fill();
        c.strokeStyle = `rgba(255,255,255,${0.6 * Math.sin(fu * PI)})`; c.lineWidth = 3; c.stroke();
      }
      c.restore();
      reChrome(c, t);
      c.restore();
      // dynamic island and glass reflection
      rrect(c, 960 - 58, P.y + 12, 116, 32, 16); c.fillStyle = '#000'; c.fill();
      c.save(); rrect(c, P.x, P.y, P.w, sh, 56); c.clip();
      const gl = c.createLinearGradient(P.x, P.y, P.x + P.w, P.y + sh); gl.addColorStop(0, 'rgba(255,255,255,0.07)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(P.x, P.y, P.w, sh); c.restore();
      grain(c, W, H, t, 0.03, 'overlay');
    },
    score(A) {
      const T = RE_T;
      A.bus.gain.value = 0.8;
      // clip A: a breezy lo-fi pop loop at 96 bpm, cut on the swipe
      const B = 60 / 96, bass = [45, 45, 52, 50, 48, 48, 43, 47], hook = [76, 79, 81, 79, 76, 74, 72, 74];
      for (let i = 0; i * B / 2 < T.swipe + 0.05; i++) {
        const t = i * B / 2;
        if (i % 4 === 0) A.kick(t, 0.5, { f: 120, f2: 45, dur: 0.32 });
        if (i % 4 === 2) A.clap(t, 0.16, { rev: 0.2 });
        A.hat(t + 0.01, i % 2 ? 0.035 : 0.05, false, { pan: 0.25 });
        if (i % 2 === 0) A.pluck(t, midi(bass[(i / 2) % 8]), { g: 0.22, bright: 0.3, dur: 0.5, lp: 900 });
        if (i % 2 === 0 && (i / 2) % 4 !== 3) A.bell(t + 0.02, midi(hook[(i / 2) % 8]), { g: 0.03, dur: 0.6, rev: 0.25, pan: -0.2 });
      }
      [[0, [57, 60, 64, 67]], [2.5, [53, 57, 60, 64]], [5.0, [55, 59, 62, 65]]].forEach(([t, n]) => A.chord(t, n, { type: 'triangle', dur: Math.min(2.5, T.swipe - t), g: 0.014, a: 0.05, hold: true, rel: 0.1, lp: 1600, width: 0.6 }));
      // jump-cut ticks and the like
      [1.3, 2.4, 3.6, 4.7].forEach(t => A.noise(t, { type: 'highpass', f: 6000, dur: 0.02, g: 0.05 }));
      A.osc(T.like, { f: 520, f2: 1250, glide: 0.08, dur: 0.14, g: 0.08, type: 'triangle' });
      A.osc(T.like + 0.17, { f: 660, f2: 1500, glide: 0.08, dur: 0.14, g: 0.06, type: 'triangle' });
      A.bell(T.like + 0.05, midi(96), { g: 0.03, dur: 0.6, rev: 0.3 });
      // the swipe
      A.whoosh(T.swipe, 0.55, { f1: 400, f2: 5000, g: 0.12 });
      // clip B: a trending sped-up track — a build, then the drop
      const B2 = 60 / 128;
      for (let t = T.swipeEnd; t < T.drop - 0.05; t += B2) A.hat(t, 0.04, false, { pan: -0.2 });
      [[T.swipeEnd, [52, 59, 64, 67]], [T.swipeEnd + 0.85, [48, 55, 60, 64]]].forEach(([t, n]) => A.chord(t, n, { type: 'sawtooth', dur: 0.85, g: 0.01, a: 0.1, hold: true, rel: 0.2, lp: 900, spread: 10, width: 0.8, rev: 0.4 }));
      [64, 67, 71, 74, 76, 79].forEach((m, i) => A.pluck(T.wait + i * 0.25, midi(m), { g: 0.1, bright: 0.6, dur: 0.6, rev: 0.4, pan: (i % 2 ? 0.3 : -0.3) }));
      A.riser(T.drop - 1.2, 1.2, { g: 0.14, f: 130 });
      A.impact(T.drop, 0.5);
      for (let i = 0; T.drop + i * B2 / 2 < 10; i++) {
        const t = T.drop + i * B2 / 2;
        if (i % 2 === 0) A.kick(t, 0.6, { f: 140, f2: 42, dur: 0.3 });
        if (i % 4 === 2) A.clap(t, 0.18);
        A.hat(t + B2 / 4, 0.045, i % 4 === 3, { pan: 0.2 });
      }
      [[T.drop, [52, 59, 64, 68, 71]], [T.drop + B2 * 2, [49, 56, 61, 64, 68]]].forEach(([t, n]) => A.chord(t, n, { type: 'sawtooth', dur: B2 * 2, g: 0.016, a: 0.01, hold: true, rel: 0.08, lp: 3200, spread: 12, width: 1, rev: 0.3 }));
      A.osc(T.follow, { f: 880, f2: 1320, glide: 0.06, dur: 0.12, g: 0.05, type: 'triangle' });
    },
  });

  /* =====================================================================
     EXPLAINER INFOGRAPHICS — the 2010s flat animated explainer: Sam pops
     in with a squash and his energy bill climbs on a red line; a circle
     wipe opens a midnight-blue scene where a donut chart sweeps on and
     the heating slice pulls out; a teal scene lays out steps 1-2-3 as
     long-shadow badges joined by dashed arrows that draw on and tick off;
     the bill bar drops 30 % while Sam cheers, and a coral wipe lands on
     the fictional brand and its call to action
     ===================================================================== */
  const EX = { cream: '#f6efe2', navy: '#23264a', navy2: '#191b38', teal: '#22a99a', teal2: '#1a8c80', coral: '#ff6b57', coral2: '#e2523f', yel: '#ffc94a', sky: '#7cc6fe', ink: '#1d1f33', white: '#ffffff', skin: '#f2b48a', shirt: '#3f7fd9', pants: '#2b2f5a', hair: '#3a2d4a' };
  const EX_F = 'Poppins, sans-serif';
  const EX_T = { sam: 0.2, bill: 0.85, line2: 1.35, w1: 2.15, pie: 2.5, slice: 3.5, w2: 4.15, st1: 4.45, st2: 5.25, st3: 6.05, w3: 7.15, res: 7.4, w4: 8.45, cta: 8.7, click: 9.45 };
  const EX_PIE = [[0.45, EX.coral, 'Heating', '45%'], [0.2, EX.yel, 'Appliances', '20%'], [0.18, EX.sky, 'Hot water', '18%'], [0.1, EX.teal, 'Lighting', '10%'], [0.07, '#9aa0c8', 'Other', '7%']];

  const exPop = (t, t0, d = 0.32) => (t < t0 ? 0 : E.outB(clamp((t - t0) / d), 2.2));
  function exTitle(c, s, t, t0, y, col, size = 64) {
    const u = E.outC(seg(t, t0, t0 + 0.35));
    if (u <= 0) return;
    c.save(); c.globalAlpha = u; text(c, s, 960, y + (1 - u) * 30, { font: EX_F, weight: 800, size, align: 'center', color: col }); c.restore();
  }
  // Sam: circle head, rounded torso, stroke limbs, no outlines.
  function exSam(c, x, y, s, mood, t, arms = 0, wave = 0) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const bob = Math.sin(t * 3.2) * 4;
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(0, 4, 110, 16, 0, 0, TAU); c.fill();
    c.fillStyle = EX.pants; rrect(c, -46, -160, 38, 162, 16); c.fill(); rrect(c, 8, -160, 38, 162, 16); c.fill();
    c.translate(0, bob);
    c.lineCap = 'round'; c.strokeStyle = '#3570c2'; c.lineWidth = 30;
    const sh = [[-64, -290], [64, -290]];
    const hands = [[lerp(-96, -132, arms), lerp(-150, -430, arms)], [lerp(96, 132, Math.max(arms, wave)), lerp(-150, -430, Math.max(arms, wave)) + Math.sin(t * 12) * 30 * wave]];
    sh.forEach((p, i) => { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(hands[i][0], hands[i][1]); c.stroke(); });
    c.fillStyle = EX.skin; hands.forEach(h => { c.beginPath(); c.arc(h[0], h[1], 17, 0, TAU); c.fill(); });
    c.fillStyle = EX.shirt; rrect(c, -74, -330, 148, 190, 56); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.16)'; rrect(c, -74, -330, 50, 190, 40); c.fill();
    c.fillStyle = EX.skin; c.fillRect(-16, -352, 32, 30);
    c.beginPath(); c.arc(0, -410, 74, 0, TAU); c.fill();
    c.fillStyle = EX.hair; c.beginPath(); c.arc(0, -420, 76, PI * 1.02, TAU * 0.99); c.fill();
    c.beginPath(); c.ellipse(30, -470, 40, 20, 0.4, 0, TAU); c.fill();
    c.fillStyle = EX.ink; [-26, 26].forEach(ex => { c.beginPath(); c.arc(ex, -402, 7.5, 0, TAU); c.fill(); });
    c.strokeStyle = EX.ink; c.lineWidth = 6;
    const bw = mood === 'worried' ? 1 : mood === 'happy' ? -0.4 : 0;
    [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(sd * 14, -428 - bw * 8); c.lineTo(sd * 40, -424 + bw * 6); c.stroke(); });
    if (mood === 'happy') { c.fillStyle = '#8a2b2b'; c.beginPath(); c.arc(0, -378, 24, 0, PI); c.fill(); }
    else if (mood === 'worried') { c.beginPath(); c.arc(0, -360, 20, 1.15 * PI, 1.85 * PI); c.stroke(); c.fillStyle = EX.sky; c.beginPath(); c.moveTo(70, -455); c.quadraticCurveTo(84, -428, 70, -420); c.quadraticCurveTo(56, -428, 70, -455); c.fill(); }
    else { c.beginPath(); c.moveTo(-14, -372); c.lineTo(14, -372); c.stroke(); }
    c.lineCap = 'butt';
    c.restore();
  }
  // Long-shadow badge: a disc with the icon's 45° shadow clipped inside it (flat design, c. 2013).
  function exBadge(c, x, y, r, col, shCol, icon, pop) {
    if (pop <= 0.001) return;
    c.save(); c.translate(x, y); c.scale(pop, pop);
    c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.save(); c.clip();
    for (let i = 2; i < r * 1.5; i += 4) { c.save(); c.translate(i, i); icon(c, shCol); c.restore(); }
    c.restore();
    icon(c, null);
    c.restore();
  }
  const exIcWindow = (c, sh) => {
    c.fillStyle = sh || '#ffffff'; rrect(c, -62, -62, 124, 124, 10); c.fill();
    c.fillStyle = sh || EX.sky; c.fillRect(-50, -50, 46, 46); c.fillRect(4, -50, 46, 46); c.fillRect(-50, 4, 46, 46); c.fillRect(4, 4, 46, 46);
    if (!sh) { c.fillStyle = EX.yel; c.save(); c.rotate(-0.12); c.fillRect(-72, 52, 144, 18); c.restore(); }
  };
  const exIcThermo = (c, sh, ang = 0) => {
    c.fillStyle = sh || '#ffffff'; c.beginPath(); c.arc(0, 0, 64, 0, TAU); c.fill();
    if (sh) return;
    c.strokeStyle = EX.coral; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, 46, 0.75 * PI, 0.75 * PI + ang); c.stroke();
    c.strokeStyle = '#e3e6ef'; c.beginPath(); c.arc(0, 0, 46, 0.75 * PI + ang + 0.25, 2.25 * PI); c.stroke(); c.lineCap = 'butt';
    text(c, '19°', 0, 14, { font: EX_F, weight: 800, size: 38, align: 'center', color: EX.ink });
  };
  const exIcBulb = (c, sh, glow = 0) => {
    if (!sh && glow > 0) { c.fillStyle = rgba(EX.yel, 0.35 * glow); c.beginPath(); c.arc(0, -16, 70 + 8 * glow, 0, TAU); c.fill(); }
    c.fillStyle = sh || EX.yel; c.beginPath(); c.arc(0, -20, 48, 0, TAU); c.fill();
    c.fillRect(-26, 10, 52, 30);
    c.fillStyle = sh || '#c9cdd9'; rrect(c, -28, 38, 56, 30, 8); c.fill();
    if (!sh) { c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(-14, -30, 20, PI, 1.4 * PI); c.stroke(); c.lineCap = 'butt'; }
  };
  const exIcHouse = (c, sh) => {
    c.fillStyle = sh || '#ffffff'; c.fillRect(-90, -40, 180, 140);
    c.fillStyle = sh || EX.coral; poly(c, [[-115, -32], [0, -125], [115, -32]]); c.fill();
    if (sh) return;
    c.fillStyle = EX.navy; c.fillRect(-20, 30, 40, 70);
    c.fillStyle = EX.yel; c.fillRect(-70, -12, 36, 32); c.fillRect(34, -12, 36, 32);
  };

  function exScene1(c, t) {
    c.fillStyle = EX.cream; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = '#ebe1cf'; c.fillRect(0, 860, 1920, 220);
    const p = exPop(t, EX_T.sam, 0.4), sq = 1 + 0.18 * Math.sin(clamp((t - EX_T.sam) / 0.4) * PI) * (1 - clamp((t - EX_T.sam) / 0.4));
    if (p > 0) { c.save(); c.translate(640, 862); c.scale(sq * p, p / sq); exSam(c, 0, 0, 1, t > EX_T.line2 + 0.15 ? 'worried' : 'neutral', t); c.restore(); }
    // the bill flies in and its line climbs
    const bu = E.outB(clamp((t - EX_T.bill) / 0.45), 1.4);
    if (bu > 0) {
      c.save(); c.translate(lerp(2200, 1240, bu), 540); c.rotate(lerp(0.4, 0.05, bu));
      c.fillStyle = 'rgba(0,0,0,0.1)'; rrect(c, -180 + 14, -230 + 14, 360, 460, 22); c.fill();
      c.fillStyle = '#fff'; rrect(c, -180, -230, 360, 460, 22); c.fill();
      c.fillStyle = EX.coral; rrect(c, -180, -230, 360, 70, 22); c.fill(); c.fillRect(-180, -190, 360, 30);
      text(c, 'ENERGY BILL', 0, -183, { font: EX_F, weight: 700, size: 28, align: 'center', color: '#fff', ls: 3 });
      c.fillStyle = '#e8e4ee'; [0, 1, 2].forEach(k => { rrect(c, -140, -120 + k * 36, 180 - k * 40, 16, 8); c.fill(); });
      c.strokeStyle = '#e8e4ee'; c.lineWidth = 3; c.beginPath(); c.moveTo(-140, 170); c.lineTo(140, 170); c.moveTo(-140, 20); c.lineTo(-140, 170); c.stroke();
      const lu = E.ioC(seg(t, EX_T.bill + 0.4, EX_T.line2 + 0.5));
      c.strokeStyle = EX.coral; c.lineWidth = 10; c.lineCap = 'round'; c.lineJoin = 'round';
      const [tip, an] = drawOn(c, [[-130, 150], [-60, 130], [0, 105], [50, 85], [130, 30]], lu);
      if (lu > 0.05) { c.fillStyle = EX.coral; c.save(); c.translate(tip[0], tip[1]); c.rotate(an); poly(c, [[14, 0], [-12, -14], [-12, 14]]); c.fill(); c.restore(); }
      c.lineCap = 'butt';
      text(c, '$', 120, -95, { font: EX_F, weight: 800, size: 70, align: 'center', color: EX.coral2 });
      c.restore();
      // alarm burst
      const ap = exPop(t, EX_T.line2 + 0.3, 0.3);
      if (ap > 0) {
        c.save(); c.translate(1440, 330); c.scale(ap, ap); c.rotate(0.15);
        c.fillStyle = EX.yel; c.beginPath(); for (let k = 0; k < 20; k++) { const r = k % 2 ? 48 : 70, a = k / 20 * TAU; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
        text(c, '+38%', 0, 12, { font: EX_F, weight: 800, size: 34, align: 'center', color: EX.ink });
        c.restore();
      }
    }
    const t2 = t > EX_T.line2;
    c.save(); c.globalAlpha = 1 - (t2 ? E.inQ(seg(t, EX_T.line2 - 0.15, EX_T.line2)) : 0);
    if (t < EX_T.line2) exTitle(c, 'Meet Sam.', t, 0.4, 190, EX.ink, 84);
    c.restore();
    if (t2) exTitle(c, 'Sam’s energy bill keeps climbing.', t, EX_T.line2, 190, EX.ink, 64);
  }

  function exScene2(c, t) {
    c.fillStyle = EX.navy; c.fillRect(0, 0, 1920, 1080);
    const gl = c.createRadialGradient(1250, 560, 0, 1250, 560, 700); gl.addColorStop(0, 'rgba(124,198,254,0.16)'); gl.addColorStop(1, 'rgba(124,198,254,0)');
    c.fillStyle = gl; c.fillRect(0, 0, 1920, 1080);
    for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(255,255,255,${0.12 + 0.3 * hash(k + 3) * (0.6 + 0.4 * Math.sin(t * 3 + k))})`; c.beginPath(); c.arc(hash(k * 1.7) * 1920, hash(k * 4.1) * 1080, 1.5 + hash(k) * 2, 0, TAU); c.fill(); }
    exTitle(c, 'Where does the energy go?', t, EX_T.w1 + 0.2, 160, '#fff', 64);
    // the house, heat rising from it
    const hp = exPop(t, EX_T.w1 + 0.25, 0.4);
    exBadge(c, 520, 600, 210, EX.navy2, '#10122a', exIcHouse, hp);
    if (hp > 0.5) {
      c.strokeStyle = rgba(EX.coral, 0.75); c.lineWidth = 8; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1, x = 470 + k * 50; c.globalAlpha = Math.sin(ph * PI); c.beginPath(); for (let j = 0; j <= 10; j++) { const y = 440 - ph * 60 - j * 8; c.lineTo(x + Math.sin(j * 0.9 + t * 6) * 8, y); } c.stroke(); }
      c.globalAlpha = 1; c.lineCap = 'butt';
    }
    // arrow from house to chart
    const au = E.ioC(seg(t, EX_T.pie - 0.1, EX_T.pie + 0.4));
    if (au > 0) {
      c.strokeStyle = '#fff'; c.lineWidth = 7; c.setLineDash([18, 14]); c.lineCap = 'round';
      const [tip, an] = drawOn(c, qbez([720, 480], [960, 520], [840, 370]), au);
      c.setLineDash([]); c.fillStyle = '#fff'; c.save(); c.translate(tip[0], tip[1]); c.rotate(an); poly(c, [[16, 0], [-12, -14], [-12, 14]]); c.fill(); c.restore(); c.lineCap = 'butt';
    }
    // donut chart sweeping on
    const cx = 1300, cy = 590, R = 240, sweep = TAU * E.ioC(seg(t, EX_T.pie, EX_T.pie + 0.9));
    let a0 = -PI / 2, acc = 0;
    EX_PIE.forEach(([f, col, lab, pct], i) => {
      const a1 = a0 + f * TAU, end = Math.min(a1, -PI / 2 + sweep);
      if (end > a0) {
        const out = i === 0 ? E.outB(clamp((t - EX_T.slice) / 0.35)) * 34 : 0, mid = (a0 + a1) / 2;
        c.save(); c.translate(Math.cos(mid) * out, Math.sin(mid) * out);
        c.fillStyle = col; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R + (i === 0 ? out * 0.4 : 0), a0, end); c.closePath(); c.fill();
        c.restore();
      }
      // labels once the sweep has passed the slice
      const lp = exPop(t, EX_T.pie + (acc + f) * 0.9 + 0.05, 0.3), mid = (a0 + a1) / 2;
      if (lp > 0) {
        const ex = Math.cos(mid), ey = Math.sin(mid), lx = cx + ex * (R + 70), ly = cy + ey * (R + 50);
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3;
        drawOn(c, [[cx + ex * (R + 10), cy + ey * (R + 10)], [lx, ly], [lx + (ex > 0 ? 30 : -30), ly]], clamp(lp));
        c.save(); c.translate(lx + (ex > 0 ? 40 : -40), ly); c.scale(lp, lp);
        text(c, pct, 0, 2, { font: EX_F, weight: 800, size: i === 0 ? 46 : 34, align: ex > 0 ? 'left' : 'right', color: col });
        text(c, lab, 0, 34, { font: EX_F, weight: 600, size: 22, align: ex > 0 ? 'left' : 'right', color: 'rgba(255,255,255,0.8)' });
        c.restore();
      }
      a0 = a1; acc += f;
    });
    if (sweep > 0) { c.fillStyle = EX.navy; c.beginPath(); c.arc(cx, cy, R * 0.52, 0, TAU); c.fill(); }
    const iu = exPop(t, EX_T.pie + 0.6, 0.3);
    if (iu > 0) { c.save(); c.translate(cx, cy); c.scale(iu, iu); exIcThermo(c, null, 1.2 + 1.5 * E.ioC(seg(t, EX_T.slice, EX_T.slice + 0.6))); c.restore(); }
  }

  const EX_STEPS = [[480, 'Seal the drafts', exIcWindow], [960, 'Smart thermostat', exIcThermo], [1440, 'Switch to LEDs', exIcBulb]];
  function exScene3(c, t) {
    c.fillStyle = EX.teal; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(hash(k * 2.3) * 1920, hash(k * 5.1) * 1080, 60 + hash(k) * 160, 0, TAU); c.fill(); }
    exTitle(c, 'Fix it in 3 easy steps', t, EX_T.w2 + 0.15, 180, '#fff', 66);
    const ts = [EX_T.st1, EX_T.st2, EX_T.st3];
    // dashed connectors drawing on between steps
    [0, 1].forEach(i => {
      const u = E.ioC(seg(t, ts[i + 1] - 0.35, ts[i + 1] + 0.05));
      if (u <= 0) return;
      const x0 = EX_STEPS[i][0] + 160, x1 = EX_STEPS[i + 1][0] - 160;
      c.strokeStyle = '#fff'; c.lineWidth = 7; c.setLineDash([16, 14]); c.lineCap = 'round';
      const [tip, an] = drawOn(c, qbez([x0, 540], [x1, 540], [(x0 + x1) / 2, 450]), u);
      c.setLineDash([]); c.fillStyle = '#fff'; c.save(); c.translate(tip[0], tip[1]); c.rotate(an); poly(c, [[14, 0], [-10, -13], [-10, 13]]); c.fill(); c.restore(); c.lineCap = 'butt';
    });
    EX_STEPS.forEach(([x, lab, ic], i) => {
      const p = exPop(t, ts[i], 0.4);
      if (p <= 0) return;
      const anim = seg(t, ts[i] + 0.2, ts[i] + 0.8);
      const icon = i === 1 ? (g, sh) => exIcThermo(g, sh, 1.6 * E.ioC(anim)) : i === 2 ? (g, sh) => exIcBulb(g, sh, E.ioC(anim)) : ic;
      exBadge(c, x, 560, 150, EX.teal2, '#13746a', icon, p);
      // number badge
      const np = exPop(t, ts[i] + 0.12, 0.3);
      c.save(); c.translate(x - 110, 450); c.scale(np, np);
      c.fillStyle = EX.coral; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill();
      text(c, String(i + 1), 0, 16, { font: EX_F, weight: 800, size: 44, align: 'center', color: '#fff' });
      c.restore();
      const lu = E.outC(seg(t, ts[i] + 0.2, ts[i] + 0.5));
      c.globalAlpha = lu; text(c, lab, x, 790 + (1 - lu) * 24, { font: EX_F, weight: 700, size: 40, align: 'center', color: '#fff' }); c.globalAlpha = 1;
      // tick off when the next step arrives
      const tk = i < 2 ? seg(t, ts[i + 1] + 0.05, ts[i + 1] + 0.35) : seg(t, EX_T.w3 - 0.45, EX_T.w3 - 0.15);
      if (tk > 0) {
        c.save(); c.translate(x + 110, 450); c.scale(E.outB(clamp(tk * 2)), E.outB(clamp(tk * 2)));
        c.fillStyle = EX.yel; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill(); c.restore();
        c.strokeStyle = EX.ink; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round';
        drawOn(c, [[x + 95, 451], [x + 106, 463], [x + 126, 438]], clamp(tk * 1.6 - 0.4));
        c.lineCap = 'butt';
      }
    });
  }

  function exScene4(c, t) {
    c.fillStyle = EX.cream; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = '#ebe1cf'; c.fillRect(0, 860, 1920, 220);
    exTitle(c, 'Sam’s bill: down 30%', t, EX_T.w3 + 0.15, 180, EX.ink, 66);
    const base = 860, h0 = 460, gu = E.outC(seg(t, EX_T.res, EX_T.res + 0.4)), du = E.outB(clamp((t - EX_T.res - 0.35) / 0.45), 1.2);
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(0, base, 1920, 3);
    const bars = [[460, h0 * gu, EX.coral, 'Before'], [760, h0 * lerp(1, 0.7, clamp(du)) * gu, EX.teal, 'After']];
    bars.forEach(([x, h, col, lab]) => {
      c.fillStyle = col; rrect(c, x - 90, base - h, 180, h, 16); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x - 90, base - h + 16, 40, Math.max(0, h - 16));
      text(c, lab, x, base + 60, { font: EX_F, weight: 700, size: 34, align: 'center', color: EX.ink });
    });
    // the dropped part as a ghost and a down arrow
    if (du > 0.05) {
      c.strokeStyle = EX.coral; c.lineWidth = 4; c.setLineDash([12, 10]); rrect(c, 670, base - h0, 180, h0 * 0.3, 16); c.stroke(); c.setLineDash([]);
      const ap = exPop(t, EX_T.res + 0.6, 0.35);
      c.save(); c.translate(1030, 500); c.scale(ap, ap);
      c.fillStyle = EX.coral; poly(c, [[-26, -90], [26, -90], [26, 0], [56, 0], [0, 70], [-56, 0], [-26, 0]]); c.fill();
      text(c, '-30%', 80, 10, { font: EX_F, weight: 800, size: 96, color: EX.coral });
      c.restore();
    }
    // coins pop out
    for (let k = 0; k < 6; k++) {
      const lt = t - EX_T.res - 0.7 - k * 0.07;
      if (lt < 0 || lt > 1.2) continue;
      const x = 760 + (hash(k) - 0.5) * 120 + lt * (hash(k + 4) - 0.3) * 500, y = base - h0 * 0.85 - lt * 600 + lt * lt * 700;
      c.fillStyle = EX.yel; c.beginPath(); c.ellipse(x, y, 26 * Math.abs(Math.cos(lt * 9 + k)), 26, 0, 0, TAU); c.fill();
    }
    const sp = exPop(t, EX_T.w3 + 0.2, 0.4), jump = Math.max(0, Math.sin((t - EX_T.res - 0.6) * 9)) * 30 * (t > EX_T.res + 0.6 ? 1 : 0);
    if (sp > 0) { c.save(); c.translate(1520, 862 - jump); c.scale(sp * 0.95, sp * 0.95); exSam(c, 0, 0, 1, 'happy', t, E.outB(clamp((t - EX_T.res - 0.5) / 0.3))); c.restore(); }
  }

  function exScene5(c, t) {
    c.fillStyle = EX.coral; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.arc(960, 470, 520 + Math.sin(t * 2) * 10, 0, TAU); c.fill();
    const lp = exPop(t, EX_T.cta, 0.45);
    if (lp > 0) {
      c.save(); c.translate(690, 420); c.scale(lp, lp); c.rotate((1 - clamp(lp)) * -0.6);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 90, 0, TAU); c.fill();
      c.fillStyle = EX.yel; poly(c, [[12, -64], [-36, 10], [-4, 10], [-14, 64], [36, -12], [4, -12]]); c.fill();
      c.restore();
    }
    const wu = E.outC(seg(t, EX_T.cta + 0.12, EX_T.cta + 0.5));
    c.globalAlpha = wu; text(c, 'Wattwise', 810 + (1 - wu) * 40, 460, { font: EX_F, weight: 800, size: 120, color: '#fff', ls: -2 }); c.globalAlpha = 1;
    exTitle(c, 'Small changes. Big savings.', t, EX_T.cta + 0.3, 610, '#fff', 44);
    const bp = exPop(t, EX_T.cta + 0.45, 0.35), press = t > EX_T.click && t < EX_T.click + 0.15 ? 0.94 : 1, pulse = 1 + 0.025 * Math.sin(t * 7) * (t > EX_T.cta + 0.8 ? 1 : 0);
    if (bp > 0) {
      c.save(); c.translate(960, 740); c.scale(bp * press * pulse, bp * press * pulse);
      c.fillStyle = EX.coral2; rrect(c, -250, -40, 500, 96, 48); c.fill();
      c.fillStyle = '#fff'; rrect(c, -250, -48, 500, 96, 48); c.fill();
      text(c, 'Get your free plan', 0, 12, { font: EX_F, weight: 700, size: 36, align: 'center', color: EX.ink });
      c.restore();
    }
    // the cursor arrives and clicks
    const cu = E.ioC(seg(t, EX_T.cta + 0.6, EX_T.click));
    if (cu > 0) {
      const x = lerp(1500, 1170, cu), y = lerp(1000, 770, cu);
      if (t > EX_T.click && t < EX_T.click + 0.4) { c.strokeStyle = `rgba(255,255,255,${1 - (t - EX_T.click) / 0.4})`; c.lineWidth = 4; c.beginPath(); c.arc(1170, 770, 20 + (t - EX_T.click) * 140, 0, TAU); c.stroke(); }
      c.fillStyle = EX.ink; poly(c, [[x, y], [x, y + 50], [x + 13, y + 38], [x + 24, y + 60], [x + 33, y + 55], [x + 22, y + 34], [x + 38, y + 34]]); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    }
    const sp = exPop(t, EX_T.cta + 0.2, 0.4);
    if (sp > 0) { c.save(); c.translate(300, 1000); c.scale(sp * 0.8, sp * 0.8); exSam(c, 0, 0, 1, 'happy', t, 0, 1); c.restore(); }
    c.globalAlpha = E.outC(seg(t, EX_T.cta + 0.6, EX_T.cta + 1.0)) * 0.85;
    text(c, 'EXPLAINER INFOGRAPHICS  ·  after 2010s animated explainers and Kurzgesagt’s flat style  ·  fictional brand', 1160, 1040, { font: EX_F, weight: 600, size: 17, align: 'center', color: '#fff', ls: 1 });
    c.globalAlpha = 1;
  }

  // scenes with the point each circle wipe grows from
  const EX_SC = [[0, exScene1], [EX_T.w1, exScene2, 1240, 540], [EX_T.w2, exScene3, 1300, 590], [EX_T.w3, exScene4, 1440, 560], [EX_T.w4, exScene5, 1030, 500]];

  MG.film({
    id: 'explainer', dur: 10, poster: 6.9,
    fonts: [['800 84px Poppins', 'Meet Sam. Where does the energy go? Fix it in 3 easy steps Wattwise -30%'], ['700 40px Poppins', 'Seal the drafts Smart thermostat Switch to LEDs Get your free plan Before After ENERGY BILL'], ['600 22px Poppins', 'Heating Appliances Hot water Lighting Other 45% 19°']],
    meta: {
      family: 'J', name: 'Explainer', sub: 'Flat animated infographics', era: '2008 —',
      origin: 'The animated explainer sells or teaches one idea in about ninety seconds: a simple character with a problem, a few flat icons and charts that draw on, a three-step solution and a call to action. Start-ups adopted it as the homepage video of the late 2000s and 2010s, while Kurzgesagt (2013 —) and TED-Ed (2012 —) pushed the same flat, colour-blocked vector style into science education.',
      works: 'Common Craft “In Plain English” videos (Lee and Sachi LeFever, 2007 —) · TED-Ed animated lessons (2012 —) · Kurzgesagt – In a Nutshell (Philipp Dettmer, 2013 —)',
      tech: ['Circle-wipe scene changes', 'Pop-on with overshoot', 'Charts and arrows that draw on'],
      accent: '#ff6b57',
      motionDNA: 'Everything pops: shapes scale in on a back-ease overshoot with a little squash, lines and dashed arrows draw on along their path, the donut sweeps clockwise and labels pop as it passes, one slice pulls out for emphasis, steps arrive one per beat and tick off, and each new idea opens with a circle wipe from the element that leads to it.',
      visualDNA: 'Flat vector shapes without outlines, a few saturated colour fields (cream, midnight blue, teal, coral) with sunny yellow accents, 2013-style long shadows inside round badges, a simple round-headed character, rounded geometric sans type, big percentages and plenty of empty space.',
      transitions: 'Pop-in character, fly-in bill with drawing line, circle wipes between scenes, donut sweep and slice pull-out, step-by-step pops joined by draw-on arrows, bar drop, final circle wipe to the CTA',
      implementation: ['Illustrator → After Effects (shape layers, Trim Paths)', 'Vyond / Animaker template tools', 'Canvas 2D (paths, clip wipes)'],
      reproducibility: 'Fully procedural (fictional brand and illustrative numbers)',
      loopable: false,
    },
    draw(c, t, W, H) {
      let i = 0; EX_SC.forEach((s, k) => { if (t >= s[0]) i = k; });
      const s = EX_SC[i], u = i > 0 ? seg(t, s[0], s[0] + 0.5) : 1;
      if (u < 1) {
        EX_SC[i - 1][1](c, t);
        c.save(); c.beginPath(); c.arc(s[2], s[3], E.ioC(u) * 2300, 0, TAU); c.clip(); s[1](c, t); c.restore();
      } else s[1](c, t);
      grain(c, W, H, t, 0.025, 'overlay');
    },
    score(A) {
      const T = EX_T;
      A.bus.gain.value = 0.85;
      const B = 0.5;
      // ukulele-style strums on a I–V–vi–IV loop
      const prog = [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [57, 60, 65, 69]], bass = [48, 43, 45, 41];
      for (let i = 0; i * B < 10; i++) {
        const t = i * B, ch = prog[Math.floor(i / 4) % 4];
        if (t > 9.75) break;
        const up = i % 2 === 1;
        (up ? [...ch].reverse() : ch).forEach((m, k) => A.pluck(t + k * 0.014, midi(m), { g: up ? 0.05 : 0.075, bright: 0.75, dur: 0.6, decay: 0.99, pan: (k - 1.5) * 0.15 }));
        if (i % 4 === 0) A.pluck(t, midi(bass[Math.floor(i / 4) % 4]), { g: 0.2, bright: 0.4, dur: 1.2, lp: 700 });
        if (t >= T.w1 && i % 2 === 1) A.clap(t, 0.09, { rev: 0.15 });
        if (t >= T.w1 && i % 2 === 0) A.kick(t, 0.25, { f: 110, f2: 50, dur: 0.25 });
      }
      // pops: a rising blip for every element that springs in
      const pop = (t, f = 500, g = 0.06) => A.osc(t, { f, f2: f * 2.2, glide: 0.07, dur: 0.12, g, type: 'sine' });
      pop(T.sam, 400, 0.08); pop(T.bill + 0.1, 600); pop(T.line2 + 0.3, 900);
      A.osc(T.bill + 0.4, { f: 300, f2: 900, glide: 0.9, dur: 0.95, g: 0.025, type: 'triangle' });
      [T.w1, T.w2, T.w3, T.w4].forEach((t, i) => A.whoosh(t, 0.45, { f1: 300, f2: 3000, g: 0.08, pan: (i % 2 ? 0.3 : -0.3) }));
      pop(T.w1 + 0.25, 450);
      A.osc(T.pie, { f: 400, f2: 1200, glide: 0.9, dur: 0.9, g: 0.03, type: 'triangle' });
      [0, 0.45, 0.65, 0.83, 0.93].forEach((f, k) => A.bell(T.pie + f * 0.9 + 0.08, midi([79, 81, 83, 84, 86][k]), { g: 0.04, dur: 0.6, rev: 0.3 }));
      A.bell(T.slice, midi(91), { g: 0.05, dur: 0.8, rev: 0.4 });
      // steps 1-2-3: glockenspiel climbing, a tick each time
      [T.st1, T.st2, T.st3].forEach((t, k) => { pop(t, 500 + k * 150, 0.07); A.bell(t + 0.05, midi([84, 88, 91][k]), { g: 0.05, dur: 1, rev: 0.35 }); });
      [T.st2 + 0.1, T.st3 + 0.1, T.w3 - 0.4].forEach(t => A.osc(t, { f: 1400, f2: 2000, glide: 0.04, dur: 0.08, g: 0.03 }));
      // result: a slide down, coins
      A.osc(T.res + 0.35, { f: 900, f2: 450, glide: 0.4, dur: 0.45, g: 0.035, type: 'triangle' });
      for (let k = 0; k < 6; k++) A.bell(T.res + 0.7 + k * 0.07, midi(96 + (k % 3) * 2), { g: 0.02, dur: 0.35, rev: 0.2, pan: (hash(k) - 0.5) * 0.8 });
      // CTA: logo pop, resolving chord, the click
      pop(T.cta, 380, 0.08);
      A.chord(T.cta, [48, 55, 60, 64, 67], { type: 'triangle', dur: 1.3, g: 0.02, a: 0.05, hold: true, rel: 0.4, lp: 2400, width: 0.8, rev: 0.4 });
      [72, 76, 79, 84].forEach((m, i) => A.bell(T.cta + 0.3 + i * 0.1, midi(m), { g: 0.04, dur: 1, rev: 0.4, pan: (i - 1.5) * 0.3 }));
      A.noise(T.click, { type: 'highpass', f: 4000, dur: 0.02, g: 0.1 });
    },
  });
})();
