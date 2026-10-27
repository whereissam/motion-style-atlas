/* batch c5 — Family G: Digital, Internet & Screen Aesthetics.
   Vaporwave (mall-soft VHS nostalgia), Frutiger Aero (glossy clean-tech optimism),
   CRT terminal → digital rain (green phosphor). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, rng, hash, vnoise, midi, text, rrect, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;900&family=Nunito:wght@600;800&display=block');
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));
  const JP = '"Noto Sans JP", sans-serif';
  const VT = 'VT323, monospace';
  const W95F = 'Archivo, "Noto Sans JP", sans-serif';
  const NU = 'Nunito, "Noto Sans JP", sans-serif';
  const mk = (w, h) => { const c = offscreen(w, h); return { c, g: c.getContext('2d') }; };

  /* =====================================================================
     G1 · VAPORWAVE
     ===================================================================== */
  const VW = { pink: '#ff71ce', cyan: '#01cdfe', mint: '#05ffa1', purple: '#b967ff', yellow: '#fffb96' };
  const VW_HZ = 650;
  const VW_KANA = 'ヴェイパーウェイヴ';
  const VW_TITLE = 'ＡＥＳＴＨＥＴＩＣ';
  const VW_FINAL = 7.32;
  // chopped & screwed clock: one beat repeats twice (tape rewinds), then fast-forwards to catch up
  const vwTime = t => (t < 6.35 ? t : t < 6.6 ? t - 0.25 : t < 6.85 ? t - 0.5 : t < 7.1 ? 6.35 + (t - 6.85) * 3 : t);

  function vwBustPaths() {
    const sil = new Path2D();
    sil.moveTo(150, 405);
    sil.bezierCurveTo(165, 330, 120, 270, 85, 225);
    sil.bezierCurveTo(70, 190, 78, 160, 92, 130);
    sil.bezierCurveTo(150, 60, 165, -60, 120, -140);
    sil.bezierCurveTo(85, -200, 0, -228, -60, -205);
    sil.bezierCurveTo(-105, -188, -132, -150, -138, -105);
    sil.bezierCurveTo(-142, -82, -142, -64, -146, -52);
    sil.lineTo(-181, 22);
    sil.bezierCurveTo(-182, 30, -176, 36, -165, 37);
    sil.bezierCurveTo(-156, 38, -150, 40, -147, 44);
    sil.bezierCurveTo(-150, 52, -153, 58, -155, 62);
    sil.bezierCurveTo(-151, 66, -146, 70, -143, 72);
    sil.bezierCurveTo(-148, 76, -150, 82, -146, 90);
    sil.bezierCurveTo(-140, 96, -136, 100, -138, 106);
    sil.bezierCurveTo(-146, 120, -146, 140, -128, 152);
    sil.bezierCurveTo(-110, 160, -95, 160, -82, 162);
    sil.bezierCurveTo(-70, 175, -62, 190, -66, 215);
    sil.bezierCurveTo(-70, 245, -90, 268, -125, 292);
    sil.bezierCurveTo(-170, 322, -210, 360, -222, 405);
    sil.bezierCurveTo(-120, 432, 60, 432, 150, 405);
    sil.closePath();
    const hair = new Path2D();
    hair.moveTo(-136, -118);
    hair.bezierCurveTo(-112, -124, -82, -114, -68, -94);
    hair.bezierCurveTo(-54, -72, -42, -42, -32, -14);
    hair.bezierCurveTo(-26, 4, -16, 16, 0, 12);
    hair.bezierCurveTo(10, -22, 60, -32, 76, -2);
    hair.bezierCurveTo(84, 22, 90, 50, 104, 84);
    hair.bezierCurveTo(156, 40, 176, -62, 130, -150);
    hair.bezierCurveTo(92, -216, 0, -242, -66, -216);
    hair.bezierCurveTo(-114, -198, -140, -160, -136, -118);
    hair.closePath();
    const ear = new Path2D();
    ear.moveTo(28, -14);
    ear.bezierCurveTo(56, -34, 80, 8, 63, 40);
    ear.bezierCurveTo(55, 60, 40, 64, 32, 52);
    ear.bezierCurveTo(38, 34, 22, 10, 28, -14);
    ear.closePath();
    const jaw = new Path2D();
    jaw.moveTo(-132, 150);
    jaw.bezierCurveTo(-95, 150, -30, 140, 10, 110);
    jaw.bezierCurveTo(30, 95, 42, 70, 46, 45);
    jaw.lineTo(115, 60); jaw.lineTo(150, 330); jaw.lineTo(-170, 330); jaw.lineTo(-90, 165);
    jaw.closePath();
    return { sil, hair, ear, jaw };
  }

  function vwBuildBust() {
    const BW = 800, BH = 1150, OX = 420, OY = 320, S = 1.38;
    const { c: cv, g } = mk(BW, BH);
    const P = vwBustPaths();
    const rad = (x, y, r, col, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const DK = '62,42,98', WH = '255,255,255';
    g.setTransform(S, 0, 0, S, OX, OY);
    // plinth: turned neck + square socle
    const cyl = g.createLinearGradient(-75, 0, 75, 0);
    cyl.addColorStop(0, '#8a8099'); cyl.addColorStop(0.3, '#f6f2f8'); cyl.addColorStop(0.65, '#d2cada'); cyl.addColorStop(1, '#6e6486');
    g.fillStyle = cyl; g.fillRect(-70, 395, 140, 80);
    const blk = g.createLinearGradient(-150, 0, 150, 0);
    blk.addColorStop(0, '#ddd6e4'); blk.addColorStop(0.4, '#faf7fb'); blk.addColorStop(1, '#8f87a2');
    g.fillStyle = blk;
    g.fillRect(-112, 468, 224, 14); g.fillRect(-128, 482, 256, 16); g.fillRect(-148, 498, 296, 130);
    g.fillStyle = `rgba(${DK},0.4)`; g.fillRect(-112, 480, 224, 3); g.fillRect(-128, 496, 256, 3); g.fillRect(-148, 498, 296, 5);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-112, 468, 224, 2); g.fillRect(-148, 504, 296, 2);
    let gr = g.createLinearGradient(0, 395, 0, 440);
    gr.addColorStop(0, `rgba(${DK},0.6)`); gr.addColorStop(1, `rgba(${DK},0)`);
    g.fillStyle = gr; g.fillRect(-70, 395, 140, 45);
    // the bust
    const base = g.createLinearGradient(-200, -240, 160, 420);
    base.addColorStop(0, '#ffffff'); base.addColorStop(0.45, '#ece7ef'); base.addColorStop(1, '#a89eb8');
    g.fillStyle = base; g.fill(P.sil);
    g.save(); g.clip(P.sil);
    gr = g.createLinearGradient(-30, 0, 170, 0); gr.addColorStop(0, `rgba(${DK},0)`); gr.addColorStop(1, `rgba(${DK},0.5)`);
    g.fillStyle = gr; g.fillRect(-300, -300, 600, 800);
    gr = g.createLinearGradient(0, 250, 0, 430); gr.addColorStop(0, `rgba(${DK},0)`); gr.addColorStop(1, `rgba(${DK},0.38)`);
    g.fillStyle = gr; g.fillRect(-300, 200, 600, 260);
    gr = g.createLinearGradient(0, 120, 0, 300); gr.addColorStop(0, `rgba(${DK},0.62)`); gr.addColorStop(1, `rgba(${DK},0)`);
    g.filter = 'blur(7px)'; g.fillStyle = gr; g.fill(P.jaw); g.filter = 'none';
    // veins
    const vr = rng(23);
    for (let k = 0; k < 11; k++) {
      let x = -210 + vr() * 380, y = -240 + vr() * 660, a = vr() * TAU;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 46; s++) { a += (vr() - 0.5) * 0.7; x += Math.cos(a) * 8; y += Math.sin(a) * 8; g.lineTo(x, y); }
      g.strokeStyle = `rgba(110,92,138,${0.1 + vr() * 0.2})`; g.lineWidth = 0.6 + vr() * 1.6; g.stroke();
    }
    // modelling: highlights + carved shadows
    rad(-100, -128, 64, WH, 0.55);
    rad(-92, 10, 72, WH, 0.4);
    rad(-130, 128, 34, WH, 0.45);
    rad(-112, -38, 40, DK, 0.34);
    rad(-152, 40, 15, DK, 0.5);
    rad(-140, 97, 15, DK, 0.35);
    rad(-120, -70, 30, WH, 0.5);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-146, -40); g.lineTo(-173, 17); g.stroke();
    // eye
    const eye = new Path2D();
    eye.moveTo(-131, -41); eye.quadraticCurveTo(-116, -50, -99, -41); eye.quadraticCurveTo(-112, -27, -129, -35); eye.closePath();
    g.fillStyle = 'rgba(255,255,255,0.65)'; g.fill(eye);
    g.strokeStyle = `rgba(${DK},0.8)`; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(-131, -41); g.quadraticCurveTo(-116, -50, -99, -41); g.stroke();
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(-129, -35); g.quadraticCurveTo(-113, -27, -101, -37); g.stroke();
    g.strokeStyle = `rgba(${DK},0.35)`; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-128, -50); g.quadraticCurveTo(-114, -60, -97, -50); g.stroke();
    g.beginPath(); g.moveTo(-134, -66); g.quadraticCurveTo(-112, -78, -86, -66); g.stroke();
    // nose wing, mouth
    g.strokeStyle = `rgba(${DK},0.5)`; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-153, 12); g.bezierCurveTo(-136, 13, -133, 34, -150, 36); g.stroke();
    g.strokeStyle = `rgba(${DK},0.65)`;
    g.beginPath(); g.moveTo(-144, 72); g.quadraticCurveTo(-135, 76, -127, 72); g.stroke();
    g.strokeStyle = `rgba(${DK},0.22)`; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-122, 56); g.quadraticCurveTo(-108, 80, -122, 96); g.stroke();
    // neck muscle, clavicle
    g.strokeStyle = `rgba(${DK},0.16)`; g.lineWidth = 16;
    g.beginPath(); g.moveTo(52, 52); g.quadraticCurveTo(-10, 180, -98, 286); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(30, 70); g.quadraticCurveTo(-30, 180, -112, 280); g.stroke();
    g.strokeStyle = `rgba(${DK},0.25)`; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-150, 318); g.quadraticCurveTo(-80, 300, -20, 330); g.stroke();
    g.strokeStyle = `rgba(${DK},0.18)`; g.lineWidth = 6;
    g.beginPath(); g.moveTo(-205, 372); g.quadraticCurveTo(-120, 400, -30, 368); g.stroke();
    // cut edge
    g.beginPath(); g.moveTo(-222, 405); g.bezierCurveTo(-120, 432, 60, 432, 150, 405); g.lineTo(150, 390);
    g.bezierCurveTo(60, 416, -120, 416, -218, 390); g.closePath();
    g.fillStyle = `rgba(${DK},0.3)`; g.fill();
    g.restore();
    // hair mass + curls
    gr = g.createLinearGradient(-120, -220, 120, 120);
    gr.addColorStop(0, '#d9d2df'); gr.addColorStop(1, '#8c8199');
    g.fillStyle = gr; g.fill(P.hair);
    // combed wavy locks flowing from the brow over the crown, clipped to the hair mass
    const HC = [14, -36];
    g.save(); g.clip(P.hair);
    for (let rho = 84; rho < 236; rho += 11) {
      const ph = rho * 0.37;
      const pt = th => { const rr = rho + 5 * Math.sin(th * 6 + ph); return [HC[0] + Math.cos(th) * rr, HC[1] + Math.sin(th) * rr]; };
      const strand = (dr, col, lw) => {
        g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
        for (let th = -2.9; th < 1.5; th += 0.04) { const [x, y] = pt(th); const k = (rho + dr) / rho; const X = HC[0] + (x - HC[0]) * k, Y = HC[1] + (y - HC[1]) * k; th === -2.9 ? g.moveTo(X, Y) : g.lineTo(X, Y); }
        g.stroke();
      };
      strand(3, `rgba(${DK},0.55)`, 3.2);
      strand(-2, 'rgba(255,255,255,0.55)', 4);
    }
    g.restore();
    // curls along the outline and fringe give the lumpy, carved silhouette
    const cr = rng(11), curls = [];
    for (let y = -262; y < 110; y += 15) {
      for (let x = -170; x < 200; x += 15) {
        const px = x + (cr() - 0.5) * 8, py = y + (cr() - 0.5) * 8;
        if (!g.isPointInPath(P.hair, OX + px * S, OY + py * S)) continue;
        const dx = px - HC[0], dy = py - HC[1], l = Math.hypot(dx, dy) || 1;
        const out = !g.isPointInPath(P.hair, OX + (px + dx / l * 15) * S, OY + (py + dy / l * 15) * S);
        const fringe = px < -40 && py < 20 && !g.isPointInPath(P.hair, OX + (px - 18) * S, OY + (py + 6) * S);
        if ((out || fringe) && cr() < 0.75) curls.push([px, py, 12 + cr() * 6, cr() * TAU, cr() < 0.5 ? 1 : -1]);
      }
    }
    curls.sort((a, b) => a[1] - b[1]);
    curls.forEach(([x, y, r, ph, dir]) => {
      g.fillStyle = `rgba(${DK},0.35)`; g.beginPath(); g.arc(x + 3, y + 4, r, 0, TAU); g.fill();
      const cg = g.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r * 1.08);
      const lit = clamp(0.62 - x / 330 - y / 700);
      cg.addColorStop(0, `rgb(${255 - (1 - lit) * 22},${252 - (1 - lit) * 26},${255 - (1 - lit) * 18})`); cg.addColorStop(0.6, '#d8d0df'); cg.addColorStop(1, '#8a7e9e');
      g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = `rgba(${DK},0.4)`; g.lineWidth = 2;
      g.beginPath(); g.arc(x + r * 0.08, y + r * 0.08, r * 0.55, ph, ph + dir * 3.6, dir < 0); g.stroke();
    });
    // ear
    gr = g.createLinearGradient(20, -20, 70, 60); gr.addColorStop(0, '#f1ecf3'); gr.addColorStop(1, '#a69bb5');
    g.fillStyle = gr; g.fill(P.ear);
    g.strokeStyle = `rgba(${DK},0.55)`; g.lineWidth = 2; g.stroke(P.ear);
    g.save(); g.clip(P.ear); rad(44, 22, 20, DK, 0.45); g.restore();
    g.beginPath(); g.moveTo(37, -5); g.bezierCurveTo(58, -12, 66, 22, 50, 40); g.strokeStyle = `rgba(${DK},0.45)`; g.stroke();
    // vaporwave rim lighting: pink sun behind, cyan bounce from the grid
    g.setTransform(1, 0, 0, 1, 0, 0);
    const rim = (dx, dy, col, a, blur) => {
      const { c: rc, g: rg } = mk(BW, BH);
      rg.drawImage(cv, 0, 0); rg.globalCompositeOperation = 'destination-out'; rg.drawImage(cv, dx, dy);
      rg.globalCompositeOperation = 'source-in'; rg.fillStyle = col; rg.fillRect(0, 0, BW, BH);
      g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.filter = `blur(${blur}px)`; g.drawImage(rc, 0, 0); g.restore();
    };
    rim(-26, 16, '#ff58c4', 0.95, 7);
    rim(22, -12, '#30e6ff', 0.6, 6);
    g.save(); g.globalCompositeOperation = 'source-atop';
    gr = g.createLinearGradient(0, 0, 0, BH); gr.addColorStop(0, 'rgba(255,190,240,0.06)'); gr.addColorStop(1, 'rgba(150,70,230,0.32)');
    g.fillStyle = gr; g.fillRect(0, 0, BW, BH); g.restore();
    return { cv, BW, BH, OX, OY };
  }

  /* Win95 chrome, drawn in 1-unit pixels under a ×2 scale for crisp chunky bevels. */
  function w95Raised(g, x, y, w, h) {
    g.fillStyle = '#c0c0c0'; g.fillRect(x, y, w, h);
    g.fillStyle = '#dfdfdf'; g.fillRect(x, y, w - 1, 1); g.fillRect(x, y, 1, h - 1);
    g.fillStyle = '#000'; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, w - 3, 1); g.fillRect(x + 1, y + 1, 1, h - 3);
    g.fillStyle = '#808080'; g.fillRect(x + 1, y + h - 2, w - 2, 1); g.fillRect(x + w - 2, y + 1, 1, h - 2);
  }
  function w95Sunken(g, x, y, w, h, fill = '#fff') {
    g.fillStyle = fill; g.fillRect(x, y, w, h);
    g.fillStyle = '#808080'; g.fillRect(x, y, w - 1, 1); g.fillRect(x, y, 1, h - 1);
    g.fillStyle = '#fff'; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = '#000'; g.fillRect(x + 1, y + 1, w - 3, 1); g.fillRect(x + 1, y + 1, 1, h - 3);
    g.fillStyle = '#dfdfdf'; g.fillRect(x + 1, y + h - 2, w - 2, 1); g.fillRect(x + w - 2, y + 1, 1, h - 2);
  }
  function w95Window(w, h, title, body) {
    const { c, g } = mk(w * 2, h * 2);
    g.scale(2, 2);
    w95Raised(g, 0, 0, w, h);
    const tb = g.createLinearGradient(3, 0, w - 3, 0);
    tb.addColorStop(0, '#000080'); tb.addColorStop(1, '#1084d0');
    g.fillStyle = tb; g.fillRect(3, 3, w - 6, 18);
    // tiny app icon
    g.fillStyle = '#fff'; g.fillRect(6, 6, 12, 12); g.fillStyle = VW.pink; g.fillRect(7, 7, 10, 5); g.fillStyle = VW.cyan; g.fillRect(7, 12, 10, 5);
    text(g, title, 22, 16.5, { font: W95F, weight: 800, size: 11, color: '#fff' });
    [w - 53, w - 37, w - 19].forEach((bx, i) => {
      w95Raised(g, bx, 5, 16, 14);
      g.fillStyle = '#000';
      if (i === 0) g.fillRect(bx + 4, 14, 6, 2);
      if (i === 1) { g.fillRect(bx + 3, 7, 9, 2); g.fillRect(bx + 3, 7, 1, 8); g.fillRect(bx + 11, 7, 1, 8); g.fillRect(bx + 3, 14, 9, 1); }
      if (i === 2) for (let k = 0; k < 7; k++) { g.fillRect(bx + 4 + k, 8 + k, 2, 1); g.fillRect(bx + 10 - k, 8 + k, 2, 1); }
    });
    body(g);
    return c;
  }
  function vwBuildChrome() {
    const win = w95Window(290, 132, 'Memories.exe', g => {
      ['File', 'Edit', 'View', 'Help'].forEach((s, i) => text(g, s, 8 + i * 36, 35, { font: W95F, size: 11, color: '#000' }));
      text(g, 'Loading memories...', 14, 60, { font: W95F, size: 11, color: '#000' });
      w95Sunken(g, 12, 68, 266, 18);
      text(g, 'Time remaining:  forever', 14, 112, { font: W95F, size: 11, color: '#000' });
    });
    const dlg = w95Window(272, 116, 'ノスタルジア.EXE', g => {
      g.fillStyle = '#800000'; g.beginPath(); g.arc(31, 50, 15, 0, TAU); g.fill();
      g.fillStyle = '#ff0000'; g.beginPath(); g.arc(30, 49, 14, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(24, 43); g.lineTo(36, 55); g.moveTo(36, 43); g.lineTo(24, 55); g.stroke();
      text(g, 'This memory has performed an', 56, 42, { font: W95F, size: 11, color: '#000' });
      text(g, 'illegal operation and will be', 56, 56, { font: W95F, size: 11, color: '#000' });
      text(g, 'shut down.', 56, 70, { font: W95F, size: 11, color: '#000' });
      w95Raised(g, 98, 82, 76, 24);
      g.strokeStyle = '#000'; g.lineWidth = 1; g.setLineDash([1, 1]); g.strokeRect(102.5, 86.5, 67, 15); g.setLineDash([]);
      text(g, 'OK', 136, 98.5, { font: W95F, size: 11, color: '#000', align: 'center' });
    });
    const { c: bar, g } = mk(1920, 60);
    g.scale(2, 2);
    g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, 960, 30);
    g.fillStyle = '#dfdfdf'; g.fillRect(0, 0, 960, 1); g.fillStyle = '#fff'; g.fillRect(0, 1, 960, 1);
    w95Raised(g, 2, 4, 56, 23);
    [['#ff3b1f', 0, 0], ['#3fbf2a', 5, 0], ['#2a6bff', 0, 5], ['#ffd21f', 5, 5]].forEach(([col, dx, dy]) => { g.fillStyle = col; g.fillRect(7 + dx, 9 + dy, 4, 4); });
    text(g, 'Start', 21, 20.5, { font: W95F, weight: 800, size: 11, color: '#000' });
    w95Sunken(g, 62, 4, 170, 23, '#d6d6d6');
    g.fillStyle = '#fff'; g.fillRect(67, 9, 11, 11); g.fillStyle = VW.pink; g.fillRect(68, 10, 9, 5); g.fillStyle = VW.cyan; g.fillRect(68, 15, 9, 4);
    text(g, 'Memories.exe', 83, 20.5, { font: W95F, weight: 800, size: 11, color: '#000' });
    w95Sunken(g, 880, 4, 76, 23, '#c0c0c0');
    text(g, '12:00 AM', 918, 20.5, { font: W95F, size: 11, color: '#000', align: 'center' });
    return { win, dlg, bar };
  }

  function vwPalm(g, x, y, h, lean, sway) {
    const tx = x + lean * h + sway * 40, ty = y - h, cx1 = x + lean * h * 0.15, cy1 = y - h * 0.55;
    const P = u => [(1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx1 + u * u * tx, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy1 + u * u * ty];
    const col = '#1d0633';
    g.fillStyle = col; g.strokeStyle = col;
    const N = 30;
    for (let k = 0; k < N; k++) {
      const u0 = k / N, u1 = (k + 1) / N, [x0, y0] = P(u0), [x1, y1] = P(u1);
      const w0 = lerp(30, 13, u0), w1 = lerp(30, 13, u1) * 1.25;
      const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
      g.beginPath();
      g.moveTo(x0 + nx / l * w0, y0 + ny / l * w0); g.lineTo(x0 - nx / l * w0, y0 - ny / l * w0);
      g.lineTo(x1 - nx / l * w1, y1 - ny / l * w1); g.lineTo(x1 + nx / l * w1, y1 + ny / l * w1);
      g.closePath(); g.fill();
    }
    g.lineCap = 'round';
    for (let f = 0; f < 10; f++) {
      const a = -Math.PI / 2 + (f - 4.5) * 0.36 + sway * 0.25 + vnoise(f * 3.1, 2) * 0.15;
      const L = h * 0.44 * (0.8 + 0.35 * hash(f + 3));
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.6 + L * 0.62 * Math.abs(Math.cos(a)) + L * 0.15;
      const qx = tx + Math.cos(a) * L * 0.55, qy = ty + Math.sin(a) * L * 0.7 - L * 0.12;
      const Q = s => [(1 - s) * (1 - s) * tx + 2 * (1 - s) * s * qx + s * s * ex, (1 - s) * (1 - s) * ty + 2 * (1 - s) * s * qy + s * s * ey];
      g.lineWidth = 7; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(qx, qy, ex, ey); g.stroke();
      for (let s = 0.05; s < 0.985; s += 0.03) {
        const [px, py] = Q(s), [qx2, qy2] = Q(s + 0.02);
        const ta = Math.atan2(qy2 - py, qx2 - px), nx = -Math.sin(ta), ny = Math.cos(ta);
        const lf = L * 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 0.6) * (0.8 + 0.4 * hash(f * 100 + s * 50)) + 8;
        [1, -1].forEach(sd => {
          const la = ta + sd * (0.62 + 0.25 * hash(f * 7 + s * 90 + sd));
          const lx = px + Math.cos(la) * lf, ly = py + Math.sin(la) * lf + lf * (0.35 + s * 0.5);
          const mx = px + Math.cos(la) * lf * 0.5, my = py + Math.sin(la) * lf * 0.5 + lf * 0.06;
          g.beginPath(); g.moveTo(px + nx * 4, py + ny * 4); g.quadraticCurveTo(mx + nx * 4, my + ny * 4, lx, ly);
          g.quadraticCurveTo(mx - nx * 3, my - ny * 3, px - nx * 4, py - ny * 4); g.closePath(); g.fill();
        });
      }
    }
    g.beginPath(); g.arc(tx, ty + 6, 16, 0, TAU); g.fill();
  }

  function vwChecker(g, cx, cy, size, rx, ry, rz) {
    const f = 1100, zc = 1100, N = 6;
    const cz = Math.cos(rz), sz = Math.sin(rz), cxr = Math.cos(rx), sxr = Math.sin(rx), cyr = Math.cos(ry), syr = Math.sin(ry);
    const P = (u, v) => {
      const x = u * size, y = v * size;
      const x1 = x * cz - y * sz, y1 = x * sz + y * cz;
      const y2 = y1 * cxr, z2 = y1 * sxr;
      const x3 = x1 * cyr + z2 * syr, z3 = -x1 * syr + z2 * cyr;
      const s = f / (zc + z3);
      return [cx + x3 * s, cy + y2 * s];
    };
    const a = P(-0.5, -0.5), b = P(0.5, -0.5), d = P(-0.5, 0.5);
    const front = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]) > 0;
    g.save();
    g.shadowColor = 'rgba(255,80,200,0.8)'; g.shadowBlur = 40;
    g.beginPath(); const q = [P(-0.5, -0.5), P(0.5, -0.5), P(0.5, 0.5), P(-0.5, 0.5)];
    q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    g.fillStyle = '#111'; g.fill();
    g.restore();
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u0 = i / N - 0.5, v0 = j / N - 0.5, u1 = u0 + 1 / N, v1 = v0 + 1 / N;
      const pts = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
      g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      g.fillStyle = (i + j) % 2 ? (front ? '#141018' : '#2b0f4f') : (front ? '#ffffff' : '#ffb8ec');
      g.fill();
    }
    g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    g.strokeStyle = VW.pink; g.lineWidth = 3; g.stroke();
  }

  function vwSun(g, cx, cy, R, t) {
    const gl = g.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.1);
    gl.addColorStop(0, 'rgba(255,100,170,0.6)'); gl.addColorStop(1, 'rgba(255,100,170,0)');
    g.fillStyle = gl; g.fillRect(cx - R * 2.2, cy - R * 2.2, R * 4.4, R * 4.4);
    const gr = g.createLinearGradient(0, cy - R, 0, cy + R);
    gr.addColorStop(0, '#fff6a0'); gr.addColorStop(0.32, '#ffbd6a'); gr.addColorStop(0.6, '#ff4d98'); gr.addColorStop(1, '#bf18c2');
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    g.fillStyle = gr;
    const top0 = cy - R * 0.08;
    g.fillRect(cx - R, cy - R, R * 2, top0 - (cy - R));
    for (let y = top0; y < cy + R; y += 2) {
      const u = (y - top0) / (R * 1.08);
      if ((((u * 7 - t * 0.45) % 1) + 1) % 1 > lerp(0.04, 0.58, u)) g.fillRect(cx - R, y, R * 2, 2.2);
    }
    g.restore();
  }

  function vwScene(g, t, st, rt) {
    const W = 1920, H = 1080;
    const oy = 300 * (1 - E.ioC(seg(t, 0.4, 3.4)));
    const hz = VW_HZ + oy;
    const fin = rt >= VW_FINAL;
    // sky
    const sky = g.createLinearGradient(0, hz - 950, 0, hz);
    sky.addColorStop(0, '#0b0326'); sky.addColorStop(0.42, '#3a0f6e'); sky.addColorStop(0.72, '#b2329a'); sky.addColorStop(0.9, '#ff6f91'); sky.addColorStop(1, '#ffb38a');
    g.fillStyle = sky; g.fillRect(0, 0, W, hz);
    st.stars.forEach(s => {
      const y = s.y + oy * 0.4;
      if (y > hz - 260) return;
      g.fillStyle = `rgba(255,230,255,${0.35 + 0.55 * Math.abs(Math.sin(t * s.tw + s.x))})`;
      g.fillRect(s.x, y, s.r, s.r);
    });
    // sun
    const sunY = hz - 180 + 150 * (1 - E.outC(seg(t, 0.2, 3.4)));
    g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip();
    vwSun(g, 960, sunY, 292, t);
    g.restore();
    // wireframe mountains
    st.mtn.forEach((pts, li) => {
      g.beginPath(); g.moveTo(pts[0][0], hz);
      pts.forEach(p => g.lineTo(p[0], hz - p[1]));
      g.lineTo(pts[pts.length - 1][0], hz); g.closePath();
      const mg = g.createLinearGradient(0, hz - 260, 0, hz); mg.addColorStop(0, '#2a0b57'); mg.addColorStop(1, '#14022c');
      g.fillStyle = mg; g.fill();
      g.strokeStyle = 'rgba(1,205,254,0.22)'; g.lineWidth = 1.5;
      g.beginPath();
      pts.forEach((p, i) => { if (i % 2 === 0) { g.moveTo(p[0], hz - p[1]); g.lineTo(p[0] + (li ? -40 : 40), hz); } });
      g.stroke();
      g.strokeStyle = 'rgba(1,205,254,0.35)'; g.lineWidth = 6;
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], hz - p[1]) : g.moveTo(p[0], hz - p[1]))); g.stroke();
      g.strokeStyle = '#7ff3ff'; g.lineWidth = 2; g.stroke();
    });
    // floor + grid
    const fl = g.createLinearGradient(0, hz, 0, H);
    fl.addColorStop(0, '#3a0a5c'); fl.addColorStop(0.3, '#1a0333'); fl.addColorStop(1, '#0a0118');
    g.fillStyle = fl; g.fillRect(0, hz, W, H - hz + 2);
    g.save(); g.translate(960, hz); g.scale(1, 2.6);
    const sr = g.createRadialGradient(0, 0, 0, 0, 0, 170); sr.addColorStop(0, 'rgba(255,110,200,0.45)'); sr.addColorStop(1, 'rgba(255,110,200,0)');
    g.fillStyle = sr; g.fillRect(-170, 0, 340, 170); g.restore();
    const camH = 430, scroll = (t * 0.55) % 1;
    for (let n = 0; n < 34; n++) {
      const z = n + 1 - scroll + 0.35;
      const y = hz + camH / z;
      if (y > H + 4) continue;
      const a = clamp(1.25 - n / 20);
      g.strokeStyle = `rgba(255,113,206,${0.22 * a})`; g.lineWidth = 7;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      g.strokeStyle = `rgba(255,170,230,${a})`; g.lineWidth = 2.2; g.stroke();
    }
    for (let i = -26; i <= 26; i++) {
      const x0 = 960 + i * 34, x1 = 960 + i * 34 * (H - hz) / 26 * 0.42;
      g.strokeStyle = 'rgba(1,205,254,0.2)'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(x0, hz); g.lineTo(x1, H); g.stroke();
      g.strokeStyle = 'rgba(120,240,255,0.95)'; g.lineWidth = 2; g.stroke();
    }
    const hzg = g.createLinearGradient(0, hz - 30, 0, hz + 120);
    hzg.addColorStop(0, 'rgba(255,120,190,0)'); hzg.addColorStop(0.25, 'rgba(255,120,190,0.75)'); hzg.addColorStop(1, 'rgba(255,120,190,0)');
    g.fillStyle = hzg; g.fillRect(0, hz - 30, W, 150);
    // floating checkerboard
    // the bust
    const B = st.bust, k = 0.86;
    const rise = 780 * (1 - E.outC(seg(t, 1.2, 4.4)));
    const bx = 930, by = 470 + oy + rise + Math.sin(t * 0.9) * 6;
    const split = rt > 5.95 && rt < VW_FINAL ? 10 + 18 * Math.abs(Math.sin(rt * 7)) : rt < 1.6 ? 0 : 0;
    if (split > 0) {
      g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.55;
      g.drawImage(st.bustP, bx - B.OX * k - split, by - B.OY * k, B.BW * k, B.BH * k);
      g.drawImage(st.bustC, bx - B.OX * k + split, by - B.OY * k, B.BW * k, B.BH * k);
      g.restore();
    }
    g.drawImage(B.cv, bx - B.OX * k, by - B.OY * k, B.BW * k, B.BH * k);
    const sh = seg(rt, 7.85, 8.9);
    if (sh > 0 && sh < 1) {
      const T = st.tmp.g, w = B.BW, h = B.BH;
      T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, w, h);
      const p = lerp(-0.4, 1.4, E.ioC(sh)) * (w + h);
      const lg = T.createLinearGradient(p - 160, 0, p + 160, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,240,255,0.8)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      T.save(); T.transform(1, 0, -0.6, 1, 0, 0); T.fillStyle = lg; T.fillRect(-w, 0, w * 3, h); T.restore();
      T.globalCompositeOperation = 'destination-in'; T.drawImage(B.cv, 0, 0);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.7;
      g.drawImage(st.tmp.c, 0, 0, w, h, bx - B.OX * k, by - B.OY * k, w * k, h * k); g.restore();
    }
    // palms
    const ps = 300 * (1 - E.outC(seg(t, 0.9, 3.8)));
    vwPalm(g, 60 - ps, H + 60, 860, 0.2, Math.sin(t * 0.7) * 0.5);
    vwPalm(g, 1870 + ps, H + 80, 900, -0.2, Math.sin(t * 0.7 + 1.3) * 0.5);
    const ck = E.outB(seg(t, 4.0, 4.9));
    if (ck > 0) vwChecker(g, 1420, 300 + Math.sin(t * 1.1) * 14 + oy, 230 * ck, 0.9 + 0.15 * Math.sin(t * 0.6), 0.3 * Math.sin(t * 0.5), 0.4 + t * 0.55);
    // vertical katakana
    [...VW_KANA].forEach((ch, i) => {
      const a = seg(t, 2.6 + i * 0.14, 2.8 + i * 0.14);
      if (a <= 0) return;
      const fl2 = a < 1 && hash(Math.floor(rt * 30) + i * 7) < 0.5 ? 0.35 : 1;
      const y = 180 + i * 94 + oy * 0.5;
      g.save(); g.translate(1690, y);
      if (ch === 'ー') g.rotate(Math.PI / 2);
      text(g, ch, 6, 6, { font: JP, weight: 900, size: 84, align: 'center', base: 'middle', color: `rgba(255,113,206,${0.95 * fl2})` });
      text(g, ch, 0, 0, { font: JP, weight: 900, size: 84, align: 'center', base: 'middle', color: `rgba(255,255,255,${fl2})` });
      g.restore();
    });
    const la = seg(t, 3.9, 4.6);
    if (la > 0) {
      g.fillStyle = `rgba(1,205,254,${0.9 * la})`; g.fillRect(1626, 140 + oy * 0.5, 3, 860 * E.outC(la));
      g.save(); g.translate(1612, 150 + oy * 0.5); g.rotate(Math.PI / 2);
      text(g, 'ＶＡＰＯＲ　ＷＡＶＥ　１９９５', 0, 0, { font: JP, weight: 500, size: 22, color: `rgba(255,255,255,${0.75 * la})`, ls: 6 });
      g.restore();
    }
    // Win95: main window
    if (!fin) {
      const WA = [150, 150, 580, 264];
      const wo = seg(t, 4.5, 4.78);
      if (wo > 0 && wo < 1) vwZoom(g, [WA[0] + 40, WA[1] + 240, 40, 20], WA, wo);
      if (wo >= 1) {
        g.drawImage(st.ch.win, WA[0], WA[1]);
        const pr = Math.min(0.99, E.outQ(seg(t, 4.85, 5.9)));
        const n = Math.floor(pr * 26);
        g.fillStyle = '#000080';
        for (let i = 0; i < n; i++) g.fillRect(WA[0] + 30 + i * 20, WA[1] + 142, 16, 26);
      }
      // error dialog + Win95 drag trail
      const DA = [1250, 180];
      const dop = seg(t, 5.7, 5.92);
      if (dop > 0 && dop < 1) vwZoom(g, [DA[0] + 250, DA[1] + 100, 40, 20], [DA[0], DA[1], 544, 232], dop);
      if (dop >= 1) {
        const s = E.ioS(seg(t, 5.95, 7.1));
        const pos = u => [lerp(DA[0], 150, u) + Math.sin(u * Math.PI * 2) * 90, lerp(DA[1], 700, E.ioS(u)) + Math.sin(u * Math.PI * 3) * 50];
        const n = Math.floor(s * 52);
        for (let i = 0; i <= n; i++) { const [x, y] = pos(i / 52); g.drawImage(st.ch.dlg, x, y); }
        const [x, y] = pos(s); g.drawImage(st.ch.dlg, x, y);
      }
    }
    // finale: title + taskbar
    if (fin) {
      const chars = [...VW_TITLE];
      const adv = 112, x0 = 960 - (chars.length - 1) * adv / 2;
      chars.forEach((ch, i) => {
        const a = E.outC(seg(rt, 7.5 + i * 0.075, 8.2 + i * 0.075));
        if (a <= 0) return;
        const x = x0 + i * adv, y = 905 + (1 - a) * 50;
        g.save(); g.globalAlpha = a;
        text(g, ch, x, y, { font: JP, weight: 900, size: 104, align: 'center', color: null, stroke: '#26073f', lw: 12 });
        text(g, ch, x + 7, y + 7, { font: JP, weight: 900, size: 104, align: 'center', color: VW.cyan });
        const tg = g.createLinearGradient(0, y - 90, 0, y + 6);
        tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.55, '#ffd9f2'); tg.addColorStop(1, '#ff7fd4');
        text(g, ch, x, y, { font: JP, weight: 900, size: 104, align: 'center', color: tg });
        g.restore();
      });
      const sa = seg(rt, 8.3, 8.8);
      if (sa > 0) text(g, 'エステティック　・　夢のモール', 960, 968, { font: JP, weight: 500, size: 28, align: 'center', color: `rgba(255,255,255,${0.9 * sa})`, ls: 10 });
      const tb = E.outC(seg(rt, 7.8, 8.15));
      g.drawImage(st.ch.bar, 0, H - 60 * tb);
    }
  }
  function vwZoom(g, a, b, p) {
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.setLineDash([6, 4]);
    for (let k = 0; k < 3; k++) {
      const u = E.outQ(clamp(p - k * 0.15));
      if (u <= 0) continue;
      g.strokeRect(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u));
    }
    g.restore();
  }
  function vwTri(c, x, y, s, dir) {
    c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + dir * s * 1.5, y); c.lineTo(x, y + s); c.closePath(); c.fill();
  }

  MG.film({
    id: 'vaporwave', dur: 10, poster: 9.4,
    fonts: [['900 84px "Noto Sans JP"', VW_KANA + VW_TITLE + 'ノスタルジアエステティック夢のモール・ＶＡＰＯＲＷＥ１９５　'], ['500 22px "Noto Sans JP"', 'ＶＡＰＯＲ　ＷＡＶＥ１９５エステティック夢のモール・'], ['400 54px VT323', 'PLAY REW FF SP 0:123456789'], ['800 22px Archivo', 'Memories.exe Start EXE'], ['400 22px Archivo', 'This memory has performed an illegal operation OK 12:00 AM File Edit View Help Loading Time remaining forever']],
    meta: {
      family: 'G', name: 'Vaporwave', sub: 'Mall-soft Nostalgia', era: '2010 —',
      origin: 'An internet microgenre that slowed, looped and pitched down 1980s–90s muzak, smooth jazz and corporate pop; its visual language of classical busts, early Windows chrome, katakana and sunset grids formed on Tumblr and Bandcamp around 2010–2012.',
      works: 'Macintosh Plus — Floral Shoppe (2011) · Chuck Person — Eccojams Vol. 1 (2010) · James Ferraro — Far Side Virtual (2011) · Saint Pepsi — Hit Vibes (2013)',
      tech: ['Classical bust + sunset grid', 'Win95 chrome & error cascades', 'VHS wobble, chopped & screwed time'],
      accent: '#ff71ce',
      motionDNA: 'Slowed, looping, deliberately stalled motion: beats repeat, the tape rewinds and fast-forwards instead of cutting.',
      visualDNA: 'Marble statuary, pink/teal sunset gradients, perspective grids, fullwidth type and katakana, early-OS windows, all under VHS artefacts.',
      transitions: 'VHS tracking roll, rewind stutter, fast-forward, Win95 zoom-open, window drag trail, snow cut',
      implementation: ['After Effects', 'Canvas 2D', 'VHS emulation'],
      reproducibility: 'Fully procedural', loopable: true,
    },
    setup() {
      const r = rng(77);
      const stars = Array.from({ length: 110 }, () => ({ x: r() * 1920, y: r() * 520, r: r() < 0.12 ? 3 : 1.6, tw: 0.5 + r() * 2 }));
      const mtn = [0, 1].map(li => {
        const pts = [];
        for (let i = 0; i <= 14; i++) {
          const u = i / 14, x = li ? lerp(1250, 1960, u) : lerp(-40, 670, u);
          const edge = li ? u : 1 - u;
          pts.push([x, (i === 0 || i === 14) ? 0 : 30 + edge * 190 * (0.55 + 0.45 * r()) + (i % 2) * 40 * r()]);
        }
        return pts;
      });
      const bust = vwBuildBust();
      const tint = col => { const { c, g } = mk(bust.BW, bust.BH); g.drawImage(bust.cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, bust.BW, bust.BH); return c; };
      return {
        stars, mtn, bust, bustP: tint('#ff3fb8'), bustC: tint('#00e5ff'), ch: vwBuildChrome(),
        S: mk(1920, 1080), R: mk(1920, 1080), GB: mk(1920, 1080), tmp: mk(bust.BW, bust.BH),
      };
    },
    draw(c, t, W, H, st) {
      if (t < 0.6) {
        c.fillStyle = '#1d2bd8'; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
        if (t > 0.12) {
          c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowOffsetX = 4; c.shadowOffsetY = 4;
          text(c, 'PLAY', 90, 130, { font: VT, size: 72, color: '#fff' });
          c.fillStyle = '#fff'; vwTri(c, 262, 108, 20, 1);
          text(c, 'SP', 1700, 130, { font: VT, size: 72, color: '#fff' });
          c.restore();
        }
        grain(c, W, H, t, 0.08, 'overlay');
        return;
      }
      const sT = vwTime(t);
      const S = st.S.g;
      S.save(); vwScene(S, sT, st, t); S.restore();
      // tracking intensity
      const open = 1 - E.outC(seg(t, 0.6, 1.7));
      const chop = Math.max(Math.exp(-Math.max(0, t - 6.35) * 14) * (t >= 6.35 ? 1 : 0), Math.exp(-Math.max(0, t - 6.6) * 14) * (t >= 6.6 ? 1 : 0));
      const ff = t >= 6.85 && t < 7.1 ? 0.55 : 0;
      const crash = t >= 7.1 && t < VW_FINAL ? 1 : 0;
      const settle = t >= VW_FINAL ? Math.exp(-(t - VW_FINAL) * 5) * 0.7 : 0;
      const trk = Math.max(0.06, open, chop * 0.8, ff, crash, settle);
      const cs = 4 + trk * 16;
      // channel split
      [[st.R, '#ff0000'], [st.GB, '#00ffff']].forEach(([B, col]) => {
        B.g.globalCompositeOperation = 'source-over'; B.g.drawImage(st.S.c, 0, 0);
        B.g.globalCompositeOperation = 'multiply'; B.g.fillStyle = col; B.g.fillRect(0, 0, W, H);
      });
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const roll = t < 1.5 ? Math.pow(1 - seg(t, 0.6, 1.5), 2) * H * 0.8 : 0;
      const bandY = H + 200 - ((t * 240) % (H + 500));
      const fr = Math.floor(t * 30);
      const dxs = [];
      for (let y = 0; y < H; y += 6) {
        let dx = Math.sin(y * 0.011 + t * 2.1) * 1.6 + vnoise(y * 0.05 + t * 9, 3) * trk * 34;
        const bd = Math.abs(y - bandY);
        if (bd < 60) dx += vnoise(y * 0.3 + fr, 5) * (14 + trk * 60) * (1 - bd / 60);
        if (crash && hash(y * 0.1 + fr) < 0.15) dx += (hash(y + fr * 3) - 0.5) * 300;
        dxs.push(dx);
      }
      const strips = (img, off) => {
        for (let y = 0, i = 0; y < H; y += 6, i++) {
          const dy = (y + roll) % H;
          c.drawImage(img, 0, y, W, 6, dxs[i] + off, dy, W, 6);
        }
      };
      strips(st.GB.c, 0);
      c.globalCompositeOperation = 'lighter';
      strips(st.R.c, cs);
      c.globalCompositeOperation = 'source-over';
      if (roll > 2) { c.fillStyle = '#000'; c.fillRect(0, roll - 14, W, 18); }
      // tracking noise streaks
      const nr = rng(fr * 13 + 1);
      const streaks = Math.floor(10 + trk * 50);
      for (let i = 0; i < streaks; i++) {
        const inBand = nr() < 0.6;
        const y = inBand ? bandY + (nr() - 0.5) * 100 : nr() * H;
        if (!inBand && nr() > trk + 0.05) continue;
        c.fillStyle = `rgba(255,255,255,${0.25 + nr() * 0.5})`;
        c.fillRect(nr() * W, y, 30 + nr() * 260, 1 + nr() * 2);
      }
      const snow = Math.max(open * 0.75, crash * 0.55, ff * 0.25, chop * 0.3, settle * 0.4);
      if (snow > 0.02) grain(c, W, H, t, snow, 'screen');
      c.fillStyle = 'rgba(20,0,40,0.14)';
      for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
      grain(c, W, H, t, 0.07, 'overlay');
      vignette(c, W, H, 0.5, '20,0,40');
      // OSD
      c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowOffsetX = 3; c.shadowOffsetY = 3; c.fillStyle = '#fff';
      const osd = s => text(c, s, 90, 130, { font: VT, size: 64, color: '#fff' });
      if (t < 2.4 || (t >= VW_FINAL && t < 8.6)) { osd('PLAY'); vwTri(c, 250, 110, 18, 1); }
      else if ((t >= 6.35 && t < 6.47) || (t >= 6.6 && t < 6.72)) { vwTri(c, 120, 110, 18, -1); vwTri(c, 150, 110, 18, -1); text(c, 'REW', 170, 130, { font: VT, size: 64, color: '#fff' }); }
      else if (t >= 6.85 && t < 7.1) { vwTri(c, 92, 110, 18, 1); vwTri(c, 122, 110, 18, 1); text(c, 'FF', 170, 130, { font: VT, size: 64, color: '#fff' }); }
      const sec = Math.floor(sT * 1) + 3;
      text(c, `SP  0:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, W - 90, 130, { font: VT, size: 52, color: 'rgba(255,255,255,0.9)', align: 'right' });
      c.restore();
    },
    score(A) {
      // tape loads
      A.noise(0.03, { type: 'lowpass', f: 900, dur: 0.12, g: 0.3 });
      A.osc(0.03, { f: 80, f2: 40, dur: 0.18, g: 0.35 });
      A.noise(0.16, { type: 'bandpass', f: 260, q: 3, dur: 0.46, g: 0.06, hold: true, rel: 0.1 });
      A.noise(0.6, { type: 'bandpass', f: 2600, f2: 300, q: 1.5, dur: 1.0, g: 0.09, swell: 0.08 });
      A.noise(0.6, { type: 'highpass', f: 5500, dur: 9.35, g: 0.016, hold: true, rel: 0.4 });
      const wow = f => [0.55, f * 0.009];
      const ep = (t, notes, dur, g = 0.045) => notes.forEach((m, i) => {
        const f = midi(m);
        A.osc(t + i * 0.014, { f, dur, g, a: 0.012, vib: wow(f), rev: 0.55, pan: i % 2 ? 0.3 : -0.3 });
        A.osc(t + i * 0.014, { f: f * 2, dur: dur * 0.3, g: g * 0.3, a: 0.004, rev: 0.5 });
        A.osc(t + i * 0.014, { f: f * 7.02, dur: 0.12, g: g * 0.06, a: 0.002 });
      });
      const pad = (t, notes, dur, g = 0.016) => A.chord(t, notes, { type: 'sawtooth', dur, g, a: 0.7, hold: true, rel: 0.5, lp: 900, spread: 11, rev: 0.6, width: 1.2 });
      const bass = (t, m, dur) => A.osc(t, { f: midi(m), dur, g: 0.2, a: 0.03, vib: wow(midi(m)), lp: 400 });
      const prog = [[0.6, 41, [57, 60, 64, 67]], [2.27, 40, [55, 59, 62, 64]], [3.93, 38, [53, 57, 60, 64]], [5.6, 36, [52, 55, 59, 64]]];
      prog.forEach(([t, b, ch]) => { ep(t, ch, 2.0, 0.055); pad(t, ch, 1.75, 0.022); bass(t, b, 1.65); });
      // slow, heavy, reverb-drenched drums
      [2.27, 3.93, 5.6].forEach(t => A.kick(t, 0.7, { f: 120, f2: 36, dur: 0.6 }));
      [3.1, 4.77].forEach(t => A.snare(t, 0.32, { f: 1200, dur: 0.35, rev: 0.9 }));
      for (let t = 2.27; t < 5.95; t += 0.4167) A.hat(t + 0.2, 0.035, false, { pan: 0.3 });
      // mall sax
      const sax = (t, m, dur, from) => {
        const f = midi(m);
        A.osc(t, { type: 'sawtooth', f: from ? midi(from) : f, f2: from ? f : undefined, glide: 0.12, dur, g: 0.04, a: 0.07, vib: [5.2, f * 0.012], lp: 1500, q: 1.2, rev: 0.5, hold: true, rel: 0.18 });
        A.osc(t, { type: 'square', f: f / 2, dur, g: 0.012, a: 0.08, lp: 700, hold: true, rel: 0.18 });
      };
      sax(2.5, 72, 0.32); sax(2.85, 69, 0.32); sax(3.2, 67, 0.85); sax(4.1, 69, 0.28); sax(4.42, 72, 0.28); sax(4.75, 76, 0.9, 74);
      // Win95
      A.whoosh(4.5, 0.3, { f1: 2000, f2: 6000, g: 0.06 });
      A.osc(4.78, { type: 'square', f: 1200, dur: 0.02, g: 0.04, hold: true, rel: 0.005 });
      const ding = t => { A.bell(t, midi(84), { g: 0.06, dur: 0.7, ratios: [1, 2, 3] }); A.bell(t, midi(79), { g: 0.05, dur: 0.7, ratios: [1, 2] }); };
      ding(5.75);
      // chopped: the same stab three times (tape rewinds), then fast-forward squeal
      [6.1, 6.35, 6.6].forEach((t, i) => {
        ep(t, [52, 55, 59, 64], 0.24, 0.05); A.osc(t, { f: midi(36), dur: 0.24, g: 0.18 }); A.kick(t, 0.55, { f: 110, f2: 36 });
        if (i) A.noise(t - 0.02, { type: 'bandpass', f: 3000, f2: 600, q: 2, dur: 0.07, g: 0.12 });
      });
      for (let k = 0; k < 8; k++) A.osc(6.85 + k * 0.03, { type: 'sawtooth', f: midi(76 + [0, 4, 7, 11, 12, 16, 19, 24][k]), dur: 0.05, g: 0.025, lp: 5000 });
      A.noise(6.85, { type: 'bandpass', f: 1800, f2: 8000, q: 3, dur: 0.25, g: 0.1 });
      // tape stop crash
      [52, 55, 59, 64].forEach(m => A.osc(7.1, { type: 'sawtooth', f: midi(m), f2: midi(m) / 5, glide: 0.24, dur: 0.24, g: 0.03, lp: 1500, hold: true, rel: 0.04 }));
      A.osc(7.1, { f: 90, f2: 25, glide: 0.24, dur: 0.26, g: 0.25 });
      A.noise(7.1, { type: 'lowpass', f: 3000, f2: 300, dur: 0.22, g: 0.16, hold: true, rel: 0.03 });
      // the resolve: lush startup chime
      const fin = [53, 57, 60, 64, 67, 72];
      A.whoosh(7.0, 0.35, { f1: 4000, f2: 900, g: 0.04 });
      pad(VW_FINAL, fin, 2.65, 0.017);
      ep(VW_FINAL, [57, 60, 64, 67], 2.6, 0.04);
      bass(VW_FINAL, 41, 2.6);
      A.kick(VW_FINAL, 0.75, { f: 120, f2: 34, dur: 0.7 });
      [65, 69, 72, 76, 79, 84, 88].forEach((m, i) => A.bell(VW_FINAL + 0.08 + i * 0.085, midi(m), { g: 0.045, dur: 2.2, rev: 0.7, pan: (i / 6 - 0.5) * 1.2 }));
      A.osc(7.98, { type: 'square', f: 900, dur: 0.02, g: 0.03, hold: true, rel: 0.005 });
      A.snare(8.15, 0.25, { f: 1200, dur: 0.35, rev: 0.9 });
      A.kick(8.98, 0.55, { f: 120, f2: 34, dur: 0.6 });
      sax(8.0, 76, 0.4); sax(8.45, 74, 0.35); sax(8.85, 72, 1.0, 71);
    },
  });

  /* =====================================================================
     G2 · FRUTIGER AERO
     ===================================================================== */
  const FA_SURF = 880;
  const FA_ORB = 6.2, FA_LOGO = 7.55;
  const faCam = t => (t < 1.5 ? 1090 - 50 * (t / 1.5) : lerp(1040, 0, E.ioC(seg(t, 1.5, 2.7))));
  const faSurfY = (x, t) => FA_SURF + Math.sin(x * 0.009 + t * 2) * 5 + Math.sin(x * 0.023 - t * 1.3) * 3;

  function faBubble(g, x, y, r, a = 1) {
    if (r < 1 || a <= 0) return;
    g.save(); g.globalAlpha *= a;
    const body = g.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
    body.addColorStop(0, 'rgba(255,255,255,0.06)'); body.addColorStop(0.68, 'rgba(190,245,255,0.16)');
    body.addColorStop(0.92, 'rgba(150,235,255,0.55)'); body.addColorStop(1, 'rgba(255,255,255,0.9)');
    g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.lineWidth = Math.max(1, r * 0.035);
    g.strokeStyle = 'rgba(255,150,255,0.22)'; g.beginPath(); g.arc(x, y, r * 0.93, 0.1 * Math.PI, 0.65 * Math.PI); g.stroke();
    g.strokeStyle = 'rgba(170,255,140,0.2)'; g.beginPath(); g.arc(x, y, r * 0.9, 0.6 * Math.PI, 0.95 * Math.PI); g.stroke();
    const hx = x - r * 0.36, hy = y - r * 0.42;
    const hl = g.createRadialGradient(hx, hy, 0, hx, hy, r * 0.48);
    hl.addColorStop(0, 'rgba(255,255,255,0.95)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.4)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.ellipse(hx, hy, r * 0.42, r * 0.3, -0.6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x + r * 0.45, y + r * 0.5, r * 0.13, r * 0.07, -0.7, 0, TAU); g.fill();
    g.restore();
  }

  const FA_FISH = [
    { main: '#ff8a1e', dark: '#d9480a', light: '#ffd28a', fin: '#ff6a00', stripe: true },
    { main: '#2d86ff', dark: '#0b3fb0', light: '#8fe0ff', fin: '#ffd23a', stripe: false },
    { main: '#ffb21e', dark: '#e86a00', light: '#fff0a0', fin: '#ff8a1e', stripe: false },
  ];
  function faFish(g, x, y, s, dir, t, ph, P) {
    g.save(); g.translate(x, y); g.scale(dir * s, s);
    const wag = Math.sin(t * 9 + ph) * 0.38;
    g.save(); g.translate(-36, 0); g.rotate(wag);
    g.beginPath(); g.moveTo(4, 0); g.quadraticCurveTo(-18, -26, -36, -30); g.quadraticCurveTo(-26, 0, -36, 30); g.quadraticCurveTo(-18, 26, 4, 0);
    g.fillStyle = P.fin; g.fill(); g.restore();
    g.beginPath(); g.moveTo(-6, -26); g.quadraticCurveTo(10, -46, 26, -24); g.closePath(); g.fillStyle = P.fin; g.fill();
    const body = new Path2D();
    body.moveTo(50, 2); body.bezierCurveTo(42, -32, -18, -34, -40, 0); body.bezierCurveTo(-18, 32, 42, 32, 50, 2);
    const gr = g.createLinearGradient(0, -30, 0, 30);
    gr.addColorStop(0, P.dark); gr.addColorStop(0.45, P.main); gr.addColorStop(1, P.light);
    g.fillStyle = gr; g.fill(body);
    g.save(); g.clip(body);
    if (P.stripe) {
      [[20, 9], [-12, 8]].forEach(([sx, w]) => {
        g.fillStyle = '#1a1a2a'; g.fillRect(sx - w - 3, -40, w * 2 + 6, 80);
        g.fillStyle = '#ffffff'; g.fillRect(sx - w, -40, w * 2, 80);
      });
    }
    const gl = g.createLinearGradient(0, -30, 0, 4);
    gl.addColorStop(0, 'rgba(255,255,255,0.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.beginPath(); g.ellipse(6, -14, 38, 12, 0, 0, TAU); g.fill();
    g.restore();
    g.beginPath(); g.moveTo(8, 10); g.quadraticCurveTo(0, 26, -12, 16); g.fillStyle = P.fin; g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(32, -5, 7, 0, TAU); g.fill();
    g.fillStyle = '#10142a'; g.beginPath(); g.arc(34, -5, 4.2, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(35.5, -6.5, 1.5, 0, TAU); g.fill();
    g.restore();
  }

  function faPill(g, x, y, w, h, kind, label, press = 0) {
    const pal = { lime: ['#e2ff8a', '#8fd826', '#4c9f0c', '#2f7a05'], aqua: ['#b8f6ff', '#2cc0f4', '#0a7fc8', '#055a9e'], silver: ['#ffffff', '#f1f6fa', '#c3d1dd', '#8396a8'] }[kind];
    const r = h / 2;
    g.save();
    g.shadowColor = 'rgba(0,50,90,0.35)'; g.shadowBlur = 16; g.shadowOffsetY = 6 * (1 - press);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, pal[1]); gr.addColorStop(1, pal[2]);
    g.fillStyle = gr; rrect(g, x, y, w, h, r); g.fill();
    g.restore();
    g.save(); rrect(g, x, y, w, h, r); g.clip();
    const bg = g.createRadialGradient(x + w / 2, y + h * 1.05, 0, x + w / 2, y + h * 1.05, w * 0.45);
    bg.addColorStop(0, pal[0]); bg.addColorStop(1, 'rgba(255,255,255,0)');
    const ga = g.globalAlpha; g.globalAlpha = ga * 0.75; g.fillStyle = bg; g.fillRect(x, y, w, h); g.globalAlpha = ga;
    if (press > 0) { g.fillStyle = `rgba(255,255,255,${0.35 * press})`; g.fillRect(x, y, w, h); }
    g.restore();
    const gl = g.createLinearGradient(0, y + 2, 0, y + h * 0.52);
    gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0.18)');
    g.fillStyle = gl; rrect(g, x + 4, y + 2.5, w - 8, h * 0.5, h * 0.25); g.fill();
    g.strokeStyle = pal[3]; g.lineWidth = 1.5; rrect(g, x, y, w, h, r); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; rrect(g, x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5); g.stroke();
    const dark = kind === 'silver';
    g.save();
    if (!dark) { g.shadowColor = 'rgba(0,40,20,0.45)'; g.shadowOffsetY = 1.5; g.shadowBlur = 2; }
    text(g, label, x + w / 2, y + h / 2 + 1, { font: NU, weight: 800, size: h * 0.42, align: 'center', base: 'middle', color: dark ? '#29506e' : '#ffffff' });
    g.restore();
  }

  function faOrb(g, cx, cy, R, t, wob, st) {
    if (R < 2) return;
    const rx = R * (1 + wob), ry = R * (1 - wob);
    const au = g.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.7);
    au.addColorStop(0, 'rgba(120,230,255,0.45)'); au.addColorStop(1, 'rgba(120,230,255,0)');
    g.fillStyle = au; g.fillRect(cx - R * 1.8, cy - R * 1.8, R * 3.6, R * 3.6);
    g.save();
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.clip();
    let gr = g.createLinearGradient(0, cy - R, 0, cy + R * 0.1);
    gr.addColorStop(0, '#7fca4e'); gr.addColorStop(0.16, '#c2ecaa'); gr.addColorStop(0.34, '#effcff'); gr.addColorStop(1, '#8ad9ff');
    g.fillStyle = gr; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    // water
    const slosh = wob * R * 1.2;
    const wy = x => cy + R * 0.02 + Math.sin(x / R * 4 + t * 2.4) * R * 0.025 + slosh * (x / R);
    g.beginPath(); g.moveTo(cx - R, cy + R);
    for (let x = -R; x <= R; x += R / 16) g.lineTo(cx + x, wy(x));
    g.lineTo(cx + R, cy + R); g.closePath();
    gr = g.createLinearGradient(0, cy, 0, cy + R);
    gr.addColorStop(0, '#43d6ff'); gr.addColorStop(0.5, '#0d8fdc'); gr.addColorStop(1, '#04509a');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(1.5, R * 0.012);
    g.beginPath(); for (let x = -R; x <= R; x += R / 16) (x === -R ? g.moveTo(cx + x, wy(x)) : g.lineTo(cx + x, wy(x))); g.stroke();
    // rays + inner bubbles + fish
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      const x0 = cx - R * 0.6 + k * R * 0.4 + Math.sin(t + k) * R * 0.05;
      const rg = g.createLinearGradient(0, cy, 0, cy + R);
      rg.addColorStop(0, 'rgba(255,255,255,0.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.beginPath(); g.moveTo(x0, cy); g.lineTo(x0 + R * 0.1, cy); g.lineTo(x0 + R * 0.3, cy + R); g.lineTo(x0 + R * 0.05, cy + R); g.fill();
    }
    g.restore();
    for (let k = 0; k < 7; k++) {
      const u = ((t * (0.35 + hash(k) * 0.3) + hash(k + 9)) % 1);
      faBubble(g, cx + (hash(k + 3) - 0.5) * R * 1.1 + Math.sin(t * 3 + k) * R * 0.03, cy + R * 0.85 - u * R * 0.8, R * (0.025 + hash(k + 5) * 0.03), 1 - u * 0.6);
    }
    const fa = t * 1.15, fdx = Math.cos(fa);
    faFish(g, cx + Math.sin(fa) * R * 0.42, cy + R * 0.45 + Math.sin(t * 2.3) * R * 0.06, R / 230 * 0.95, clamp(fdx * 3, -1, 1) || 0.01, t, 0, FA_FISH[2]);
    // glass shading
    gr = g.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);
    gr.addColorStop(0, 'rgba(0,70,140,0)'); gr.addColorStop(1, 'rgba(0,60,130,0.5)');
    g.fillStyle = gr; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    gr = g.createRadialGradient(cx, cy + R * 0.82, 0, cx, cy + R * 0.82, R * 0.62);
    gr.addColorStop(0, 'rgba(210,255,255,0.75)'); gr.addColorStop(1, 'rgba(210,255,255,0)');
    g.fillStyle = gr; g.fillRect(cx - R, cy, R * 2, R);
    g.restore();
    // gloss cap
    gr = g.createLinearGradient(0, cy - ry * 0.95, 0, cy - ry * 0.02);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0.06)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy - ry * 0.48, rx * 0.8, ry * 0.46, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(1.5, R * 0.012);
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(40,170,230,0.35)'; g.lineWidth = Math.max(2, R * 0.03);
    g.beginPath(); g.ellipse(cx, cy, rx + R * 0.02, ry + R * 0.02, 0, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    faSpark(g, cx - R * 0.5, cy - R * 0.52, R * 0.16, 0.9);
  }
  function faSpark(g, x, y, s, a) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, s);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
    g.fillStyle = `rgba(255,255,255,${a})`;
    [0, Math.PI / 2].forEach(r => { g.save(); g.rotate(r); g.beginPath(); g.moveTo(-s * 1.6, 0); g.lineTo(0, -s * 0.09); g.lineTo(s * 1.6, 0); g.lineTo(0, s * 0.09); g.closePath(); g.fill(); g.restore(); });
    g.restore();
  }

  const FA_HY = 470;
  function faHills(fs) {
    const { c, g } = mk(1920, FA_SURF + 20 - FA_HY);
    g.translate(0, -FA_HY);
    const r = rng(404);
    fs.forEach(([fy, c0, c1, c2, sheenX], li) => {
      const path = new Path2D(); path.moveTo(0, FA_SURF + 20);
      for (let x = 0; x <= 1920; x += 16) path.lineTo(x, fy(x));
      path.lineTo(1920, FA_SURF + 20); path.closePath();
      if (li) { g.save(); g.filter = 'blur(14px)'; g.translate(0, -10); g.fillStyle = 'rgba(20,70,10,0.35)'; g.fill(path); g.restore(); }
      const hg = g.createLinearGradient(0, 560, 0, FA_SURF);
      hg.addColorStop(0, c0); hg.addColorStop(0.5, c1); hg.addColorStop(1, c2);
      g.fillStyle = hg; g.fill(path);
      g.save(); g.clip(path);
      for (let k = 0; k < 2600; k++) {
        const x = r() * 1920, y0 = fy(x), y = y0 + 6 + Math.pow(r(), 0.7) * (FA_SURF - y0);
        const len = 4 + (y - y0) * 0.02 + r() * 4;
        g.strokeStyle = r() < 0.5 ? `rgba(230,255,150,${0.08 + r() * 0.12})` : `rgba(20,90,10,${0.06 + r() * 0.1})`;
        g.lineWidth = 1 + (y - y0) * 0.004;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - len); g.stroke();
      }
      const sh = g.createRadialGradient(sheenX, fy(sheenX) + 30, 0, sheenX, fy(sheenX) + 30, 480);
      sh.addColorStop(0, 'rgba(255,255,210,0.45)'); sh.addColorStop(1, 'rgba(255,255,210,0)');
      g.fillStyle = sh; g.fillRect(sheenX - 480, FA_HY, 960, 600);
      g.restore();
      g.save(); g.strokeStyle = 'rgba(240,255,190,0.55)'; g.lineWidth = 3; g.filter = 'blur(2px)';
      g.beginPath(); for (let x = 0; x <= 1920; x += 16) (x ? g.lineTo(x, fy(x) + 2) : g.moveTo(x, fy(x) + 2)); g.stroke(); g.restore();
    });
    return c;
  }
  function faCloud(p, s) {
    const w = Math.round(560 * s), h = Math.round(300 * s);
    const { c, g } = mk(w, h);
    const cx = w / 2, by = h * 0.68;
    const puffs = (dy, k) => { const P = new Path2D(); p.forEach(([dx, py, r]) => { P.moveTo(cx + dx * s + r * s * k, by + (py + dy) * s); P.arc(cx + dx * s, by + (py + dy) * s, r * s * k, 0, TAU); }); if (k >= 1) P.rect(cx - 170 * s, by - 10 * s, 340 * s, 34 * s); return P; };
    g.filter = 'blur(2px)';
    g.fillStyle = '#c4def4'; g.fill(puffs(0, 1));
    g.filter = `blur(${8 * s}px)`;
    const wg = g.createLinearGradient(0, by - 110 * s, 0, by + 20 * s);
    wg.addColorStop(0, '#ffffff'); wg.addColorStop(1, '#eaf5ff');
    g.fillStyle = wg; g.fill(puffs(-10, 0.92));
    g.filter = `blur(${4 * s}px)`; g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(puffs(-22, 0.7));
    return c;
  }
  function faRays() {
    const { c, g } = mk(2120, 1300);
    g.filter = 'blur(20px)';
    const r = rng(8);
    for (let k = 0; k < 11; k++) {
      const x = 100 + k * 190 + r() * 80, w0 = 14 + r() * 40, sp = 120 + r() * 200, sk = (r() - 0.3) * 260;
      const rg = g.createLinearGradient(0, 0, 0, 1250);
      const a = 0.12 + r() * 0.16;
      rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(0.5, `rgba(220,250,255,${a * 0.45})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.beginPath(); g.moveTo(x - w0, 0); g.lineTo(x + w0, 0); g.lineTo(x + sk + sp, 1250); g.lineTo(x + sk - sp * 0.6, 1250); g.closePath(); g.fill();
    }
    return c;
  }
  function faWorld(g, t, cy, st) {
    const W = 1920;
    g.save(); g.translate(0, -cy);
    // sky
    const sk = g.createLinearGradient(0, 0, 0, 820);
    sk.addColorStop(0, '#0757c4'); sk.addColorStop(0.38, '#2696ee'); sk.addColorStop(0.72, '#9ad9ff'); sk.addColorStop(1, '#f0fcff');
    g.fillStyle = sk; g.fillRect(0, -10, W, FA_SURF + 20);
    const sun = g.createRadialGradient(1490, 150, 0, 1490, 150, 460);
    sun.addColorStop(0, 'rgba(255,255,255,1)'); sun.addColorStop(0.07, 'rgba(255,255,245,0.95)'); sun.addColorStop(0.22, 'rgba(255,255,230,0.35)'); sun.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sun; g.fillRect(1030, -310, 920, 920);
    // clouds
    st.clouds.forEach(cl => {
      const x = ((cl.x + t * cl.v) % 2500) - 300;
      g.drawImage(cl.img, x - cl.img.width / 2, cl.y - cl.img.height * 0.68);
    });
    // aurora silk strands
    if (t > 2.4) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const rev = E.ioC(seg(t, 2.6 + k * 0.18, 4.0 + k * 0.18));
        if (rev <= 0) continue;
        const col = ['150,255,240', '200,255,120', '255,255,255'][k];
        for (let s = 0; s < 14; s++) {
          g.strokeStyle = `rgba(${col},${0.07 + 0.05 * Math.sin(s * 0.7)})`; g.lineWidth = 2.2;
          g.beginPath();
          for (let x = -40; x <= W * rev + 40; x += 30) {
            const y = 300 + k * 90 + Math.sin(x * 0.0026 + t * 0.6 + k * 1.7) * 120 + Math.sin(x * 0.006 - t * 0.4 + k) * 30 + s * (5 + k * 1.5) * Math.sin(x * 0.002 + k);
            x === -40 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.stroke();
        }
      }
      g.restore();
    }
    g.drawImage(st.hills, 0, FA_HY);
    // underwater
    g.beginPath(); g.moveTo(0, faSurfY(0, t));
    for (let x = 0; x <= W; x += 24) g.lineTo(x, faSurfY(x, t));
    g.lineTo(W, 2300); g.lineTo(0, 2300); g.closePath();
    const uw = g.createLinearGradient(0, FA_SURF, 0, 2200);
    uw.addColorStop(0, '#8af0ff'); uw.addColorStop(0.1, '#3cc8f2'); uw.addColorStop(0.4, '#1092d4'); uw.addColorStop(1, '#03396f');
    g.fillStyle = uw; g.fill();
    g.save(); g.clip();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.9; g.drawImage(st.rays, -100 + Math.sin(t * 0.35) * 40, FA_SURF);
    g.globalAlpha = 0.45 + 0.2 * Math.sin(t * 1.3); g.drawImage(st.rays, 2020 + Math.sin(t * 0.5 + 2) * 60, FA_SURF, -2120, 1300);
    g.globalAlpha = 1;
    st.specks.forEach(p => {
      const x = (p.x + t * p.v) % 1920, y = p.y + Math.sin(t * 0.8 + p.x) * 12;
      g.fillStyle = `rgba(230,255,255,${p.a * (0.6 + 0.4 * Math.sin(t * 3 + p.x))})`; g.fillRect(x, y, p.r, p.r);
    });
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 2.5;
    for (let j = 0; j < 9; j++) {
      g.beginPath();
      for (let x = 0; x <= W; x += 20) {
        const y = FA_SURF + 30 + j * 32 + Math.sin(x * 0.02 + t * 1.6 + j * 2.1) * 9 + Math.sin(x * 0.007 - t + j) * 14;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    st.fish.forEach(f => {
      const x = ((f.x + f.dir * f.v * t) % 2400 + 2400) % 2400 - 240;
      g.globalAlpha = f.y < 1200 ? 1 : clamp(0.35 + f.s * 0.4);
      faFish(g, x, f.y + Math.sin(t * 1.3 + f.ph) * 10, f.s, f.dir, t, f.ph, FA_FISH[f.k]);
      g.globalAlpha = 1;
    });
    st.ubub.forEach(b => {
      const y = 2150 - ((t * b.v + b.o) % 1300);
      faBubble(g, b.x + Math.sin(t * 2 + b.o) * 10, y, b.r, clamp((y - FA_SURF) / 60));
    });
    const ug = g.createLinearGradient(0, FA_SURF, 0, FA_SURF + 34);
    ug.addColorStop(0, 'rgba(255,255,255,0.75)'); ug.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = ug; g.fillRect(0, FA_SURF - 10, W, 50);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3;
    g.beginPath(); for (let x = 0; x <= W; x += 24) (x ? g.lineTo(x, faSurfY(x, t)) : g.moveTo(x, faSurfY(x, t))); g.stroke();
    g.restore();
  }

  MG.film({
    id: 'frutiger', dur: 10, poster: 9.4,
    fonts: [['800 180px Nunito', 'aero Welcome to Aero'], ['600 30px Nunito', 'Everything is connected. clear · fresh · alive'], ['800 28px Nunito', 'ConnectShareExplore']],
    meta: {
      family: 'G', name: 'Frutiger Aero', sub: 'Glossy Clean-tech Optimism', era: '2004 — 2013',
      origin: 'A retroactively named mid-2000s look (the label spread in the late 2010s via the Consumer Aesthetics Research Institute) of glossy glass UI, aqua bubbles and green nature imagery, epitomised by Windows Vista’s Aero and early skeuomorphic iPhone OS.',
      works: 'Windows Vista Aero (2007) · Windows 7 (2009) · Mac OS X Aqua (2000) · iPhone OS 1–6 (2007–2012) · Nintendo Wii Menu (2006)',
      tech: ['Glossy half-pill highlights', 'Glass orbs, bubbles & water', 'Sky, grass hills & lens flares'],
      accent: '#2fc4ff',
      motionDNA: 'Buoyant, floating motion: rising bubbles, springy UI pops, gentle drifting light and slow camera lifts.',
      visualDNA: 'Sky-blue and lime gradients, wet glass with specular caps, aqua water and fish, rolling green hills, aurora swooshes and lens flares.',
      transitions: 'Underwater rise, water-surface breach, glass slide-in, bubble converge, shrink-fade, shine sweep',
      implementation: ['Photoshop / Illustrator', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: true,
    },
    setup() {
      const r = rng(31);
      const clouds = Array.from({ length: 7 }, (_, i) => ({
        x: i * 360 + r() * 200, y: 120 + r() * 300, s: 0.6 + r() * 0.8, v: 6 + r() * 10,
        p: Array.from({ length: 8 }, (_, k) => [(k - 3.5) * 42 + r() * 20, -Math.sin((k + 0.5) / 8 * Math.PI) * 50 * (0.6 + r() * 0.6), 34 + r() * 30]),
      }));
      const fish = [
        { x: 200, y: 1500, s: 1.5, dir: 1, v: 140, ph: 0, k: 0 }, { x: 1500, y: 1700, s: 1.1, dir: -1, v: 110, ph: 2, k: 1 },
        { x: 900, y: 1300, s: 0.9, dir: 1, v: 90, ph: 4, k: 2 }, { x: 1900, y: 1850, s: 1.7, dir: -1, v: 150, ph: 1, k: 1 },
        { x: 600, y: 1045, s: 0.7, dir: 1, v: 70, ph: 3, k: 0 }, { x: 1700, y: 1062, s: 0.65, dir: -1, v: 80, ph: 5, k: 1 },
      ];
      const ubub = Array.from({ length: 34 }, () => ({ x: r() * 1920, v: 120 + r() * 220, o: r() * 1300, r: 6 + Math.pow(r(), 2) * 34 }));
      const airb = Array.from({ length: 30 }, (_, i) => ({ x: 100 + r() * 1720, t0: 2.4 + r() * 2.4, v: 70 + r() * 120, r: 16 + Math.pow(r(), 1.6) * 60, ph: r() * TAU, a0: r() * TAU, d: r() * 0.35 }));
      const drops = Array.from({ length: 16 }, () => ({ x: 80 + r() * 1760, y: 60 + r() * 900, r: 10 + Math.pow(r(), 2) * 40, v: 20 + r() * 70, d: r() * 0.25 }));
      clouds.forEach(cl => { cl.img = faCloud(cl.p, cl.s); });
      const specks = Array.from({ length: 90 }, () => ({ x: r() * 1920, y: FA_SURF + 40 + r() * 1200, v: 4 + r() * 14, r: 1.5 + r() * 2.5, a: 0.2 + r() * 0.5 }));
      const hills = faHills([
        [x => 655 + 36 * Math.sin(x * 0.004 + 1) + 22 * Math.sin(x * 0.009 + 2), '#b4ecc6', '#7fcb93', '#5aae70', 300],
        [x => 715 - 130 * Math.exp(-Math.pow((x - 520) / 520, 2)) + 18 * Math.sin(x * 0.006), '#cdf766', '#6cc427', '#3a9614', 520],
        [x => 800 - 95 * Math.exp(-Math.pow((x - 1520) / 620, 2)) + 10 * Math.sin(x * 0.01 + 1), '#bff04c', '#55b41e', '#2e8410', 1450],
      ]);
      const bokeh = mk(300, 300);
      bokeh.g.filter = 'blur(9px)'; faBubble(bokeh.g, 150, 150, 120, 1);
      return { clouds, fish, ubub, airb, drops, specks, hills, rays: faRays(), bokeh: bokeh.c, BG: mk(1920, 1080), s1: mk(480, 270), WM: mk(900, 280), RF: mk(900, 280) };
    },
    draw(c, t, W, H, st) {
      const cy = faCam(t);
      const g = st.BG.g;
      g.save(); faWorld(g, t, cy, st); g.restore();
      c.drawImage(st.BG.c, 0, 0);
      if (t > 2.3) {
        [[160, 1.0, 0], [1760, 1.4, 1.3], [1450, 0.7, 2.1], [420, 0.55, 3.0]].forEach(([x, sc, d], i) => {
          const y = 1250 - (t - 2.3 + d) * (90 + i * 25);
          if (y < -400) return;
          c.globalAlpha = 0.55; c.drawImage(st.bokeh, x - 150 * sc + Math.sin(t + i) * 30, y - 150 * sc, 300 * sc, 300 * sc); c.globalAlpha = 1;
        });
      }
      // foreground hero bubble (hook)
      if (t < 1.6) {
        const u = t / 1.6;
        faBubble(c, 760 + Math.sin(t * 3) * 30, lerp(1250, -260, E.inQ(u) * 0.6 + u * 0.4), 190, 1);
      }
      // airborne bubbles + converge into the orb
      const O = { x: 960, y: 500 };
      const orbXY = () => {
        const m = E.ioC(seg(t, FA_LOGO - 0.15, FA_LOGO + 0.45));
        return [960, lerp(500, 400, m) + Math.sin(t * 1.4) * 8 * seg(t, FA_ORB, FA_ORB + 1)];
      };
      if (t > 2.4 && t < FA_ORB + 0.1) {
        st.airb.forEach((b, i) => {
          const age = t - b.t0;
          if (age < 0) return;
          let x = b.x + Math.sin(age * 1.4 + b.ph) * 40, y = 900 - age * b.v, r = b.r * clamp(age * 3);
          const p = E.inC(seg(t, 5.0 + b.d, FA_ORB));
          if (p > 0) {
            const a = b.a0 + p * 5, rad = (1 - p) * (380 + i * 9);
            x = lerp(x, O.x + Math.cos(a) * rad, E.ioC(Math.min(1, p * 1.8)));
            y = lerp(y, O.y + Math.sin(a) * rad * 0.8, E.ioC(Math.min(1, p * 1.8)));
            r *= 1 - p * 0.6;
          }
          if (y < -100 && p === 0) return;
          faBubble(c, x, y, r, 1);
        });
      }
      // glass panel
      const pin = spring(t - 3.1, 1.6, 0.6), pout = E.inB(seg(t, 4.95, 5.35));
      if (t > 3.1 && pout < 0.999) {
        const pw = 840, ph = 440, scl = lerp(1, 0.6, pout), alpha = clamp(pin * 1.3) * (1 - pout);
        const px = 960 - pw / 2, py = 250 + (1 - pin) * 140;
        c.save();
        c.globalAlpha = alpha;
        c.translate(960, py + ph / 2); c.scale(scl, scl); c.translate(-960, -(py + ph / 2));
        c.save(); c.shadowColor = 'rgba(0,40,90,0.35)'; c.shadowBlur = 50; c.shadowOffsetY = 18;
        c.fillStyle = 'rgba(255,255,255,0.2)'; rrect(c, px, py, pw, ph, 30); c.fill(); c.restore();
        st.s1.g.filter = 'blur(5px)'; st.s1.g.drawImage(st.BG.c, -20, -12, 520, 294); st.s1.g.filter = 'none';
        c.save(); rrect(c, px, py, pw, ph, 30); c.clip();
        c.drawImage(st.s1.c, 0, 0, W, H);
        c.fillStyle = 'rgba(235,250,255,0.42)'; c.fillRect(px, py, pw, ph);
        const tg = c.createLinearGradient(0, py, 0, py + ph * 0.42);
        tg.addColorStop(0, 'rgba(255,255,255,0.75)'); tg.addColorStop(1, 'rgba(255,255,255,0.12)');
        c.fillStyle = tg; c.fillRect(px, py, pw, ph * 0.42);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(px, py + ph * 0.42, pw, 2);
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.5; rrect(c, px, py, pw, ph, 30); c.stroke();
        c.strokeStyle = 'rgba(0,100,170,0.25)'; c.lineWidth = 1; rrect(c, px + 3, py + 3, pw - 6, ph - 6, 27); c.stroke();
        faOrb(c, px + 82, py + 86, 34, t, 0, st);
        c.save(); c.shadowColor = 'rgba(255,255,255,0.95)'; c.shadowBlur = 14;
        text(c, 'Welcome to Aero', px + 140, py + 104, { font: NU, weight: 800, size: 50, color: '#0a3a6b' });
        text(c, 'Everything is connected.', px + 142, py + 150, { font: NU, weight: 600, size: 28, color: 'rgba(10,58,107,0.78)' });
        c.restore();
        const press = bump(t, 4.58, 0.04, 0.08, 0.25);
        [['lime', 'Connect'], ['aqua', 'Share'], ['silver', 'Explore']].forEach(([k, l], i) => {
          const s = spring(t - 3.5 - i * 0.15, 2.2, 0.45);
          if (s <= 0) return;
          const bw = 230, bh = 70, bx = px + 52 + i * 252, by = py + 300;
          c.save(); c.translate(bx + bw / 2, by + bh / 2); const sc2 = s * (i === 0 ? 1 - press * 0.05 : 1); c.scale(sc2, sc2);
          faPill(c, -bw / 2, -bh / 2, bw, bh, k, l, i === 0 ? press : 0);
          c.restore();
        });
        // click ripple
        const rp = seg(t, 4.6, 5.1);
        if (rp > 0 && rp < 1) {
          c.strokeStyle = `rgba(255,255,255,${1 - rp})`; c.lineWidth = 4;
          c.beginPath(); c.ellipse(px + 167, py + 335, 115 + rp * 120, 35 + rp * 60, 0, 0, TAU); c.stroke();
        }
        c.restore();
      }
      // cursor
      if (t > 3.9 && t < 5.2) {
        const m = E.ioC(seg(t, 4.0, 4.5));
        const x = lerp(1380, 580, m), y = lerp(960, 600, m) + Math.sin(m * Math.PI) * -60;
        const a = 1 - seg(t, 5.0, 5.2);
        c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(1.6, 1.6);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(6.5, 20); c.lineTo(11, 30); c.lineTo(15, 28); c.lineTo(10.5, 18.5); c.lineTo(19, 18.5); c.closePath();
        c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
        c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#111'; c.lineWidth = 1.2; c.stroke();
        c.restore();
      }
      // the orb
      if (t >= FA_ORB - 0.05) {
        const [ox, oy] = orbXY();
        const grow = spring(t - FA_ORB + 0.05, 1.7, 0.42);
        const R = lerp(230, 190, E.ioC(seg(t, FA_LOGO - 0.15, FA_LOGO + 0.45))) * grow;
        const wob = 0.09 * Math.exp(-(t - FA_ORB) * 3.5) * Math.sin((t - FA_ORB) * 17);
        faOrb(c, ox, oy, R, t, wob, st);
        // formation flash + rings
        const fl = Math.exp(-Math.max(0, t - FA_ORB) * 6) * (t >= FA_ORB ? 1 : 0);
        if (fl > 0.01) {
          c.save(); c.globalCompositeOperation = 'lighter';
          const fg = c.createRadialGradient(ox, oy, 0, ox, oy, 600);
          fg.addColorStop(0, `rgba(255,255,255,${fl})`); fg.addColorStop(0.3, `rgba(170,240,255,${fl * 0.5})`); fg.addColorStop(1, 'rgba(170,240,255,0)');
          c.fillStyle = fg; c.fillRect(ox - 600, oy - 600, 1200, 1200); c.restore();
        }
        [0, 0.18].forEach(d => {
          const rp = seg(t, FA_ORB + d, FA_ORB + d + 1.1);
          if (rp <= 0 || rp >= 1) return;
          c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - rp)})`; c.lineWidth = 6 * (1 - rp) + 1;
          c.beginPath(); c.arc(ox, oy, 240 + E.outC(rp) * 520, 0, TAU); c.stroke();
        });
        // sparkles around
        for (let k = 0; k < 9; k++) {
          const a = k / 9 * TAU + t * 0.25, rr = R * (1.25 + 0.2 * Math.sin(k * 2.1));
          const tw = Math.pow(Math.max(0, Math.sin(t * 2.2 + k * 1.9)), 6) * seg(t, FA_ORB + 0.4, FA_ORB + 1);
          faSpark(c, ox + Math.cos(a) * rr, oy + Math.sin(a) * rr * 0.9, 14 + 10 * hash(k), tw);
        }
      }
      // wordmark
      if (t > FA_LOGO) {
        const a = E.outC(seg(t, FA_LOGO + 0.1, FA_LOGO + 0.8));
        const WM = st.WM.g, ww = 900, wh = 280;
        WM.globalCompositeOperation = 'source-over'; WM.clearRect(0, 0, ww, wh);
        const tg = WM.createLinearGradient(0, 70, 0, 230);
        tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.5, '#f0fdff'); tg.addColorStop(0.52, '#c6f1ff'); tg.addColorStop(1, '#7fdcff');
        text(WM, 'aero', ww / 2, 210, { font: NU, weight: 800, size: 190, align: 'center', color: tg, stroke: 'rgba(0,110,170,0.55)', lw: 3, ls: -4 });
        const sh = seg(t, 8.35, 9.0);
        if (sh > 0 && sh < 1) {
          WM.globalCompositeOperation = 'source-atop';
          const p = lerp(-200, ww + 200, E.ioC(sh));
          const lg = WM.createLinearGradient(p - 90, 0, p + 90, 0);
          lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
          WM.fillStyle = lg; WM.fillRect(0, 0, ww, wh);
        }
        const RF = st.RF.g;
        RF.globalCompositeOperation = 'source-over'; RF.clearRect(0, 0, ww, wh);
        RF.save(); RF.translate(0, 430); RF.scale(1, -1); RF.drawImage(st.WM.c, 0, 0); RF.restore();
        RF.globalCompositeOperation = 'destination-in';
        const mg = RF.createLinearGradient(0, 210, 0, 300); mg.addColorStop(0, 'rgba(0,0,0,0.4)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
        RF.fillStyle = mg; RF.fillRect(0, 0, ww, wh);
        const sc = lerp(1.08, 1, a), x0 = 960 - ww / 2, y0 = 760 - 210;
        c.save(); c.globalAlpha = a;
        c.translate(960, 700); c.scale(sc, sc); c.translate(-960, -700);
        c.drawImage(st.RF.c, x0, y0);
        c.shadowColor = 'rgba(0,70,40,0.45)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
        c.drawImage(st.WM.c, x0, y0);
        c.restore();
        const ta = seg(t, 8.7, 9.2);
        if (ta > 0) { c.save(); c.shadowColor = 'rgba(0,60,120,0.7)'; c.shadowBlur = 10; c.shadowOffsetY = 2; text(c, 'clear  ·  fresh  ·  alive', 960, 955, { font: NU, weight: 800, size: 34, align: 'center', color: `rgba(255,255,255,${ta})`, ls: 8 }); c.restore(); }
      }
      // lens flare from the sun
      const sy = 150 - cy;
      if (sy > -300) {
        const pulse = 0.55 + 0.45 * Math.exp(-Math.max(0, t - FA_ORB) * 2.5) * (t >= FA_ORB ? 1 : 0) + 0.15 * Math.sin(t * 0.8);
        const fa = clamp(1 - (-sy) / 300) * pulse;
        c.save(); c.globalCompositeOperation = 'lighter';
        c.save(); c.translate(1490, sy); c.scale(7, 0.22);
        const st1 = c.createRadialGradient(0, 0, 0, 0, 0, 160);
        st1.addColorStop(0, `rgba(255,255,255,${0.7 * fa})`); st1.addColorStop(1, 'rgba(160,220,255,0)');
        c.fillStyle = st1; c.beginPath(); c.arc(0, 0, 160, 0, TAU); c.fill(); c.restore();
        const vx = 960 - 1490, vy = 540 - sy;
        [[0.35, 34, '180,255,200', 0.12], [0.6, 18, '255,255,255', 0.16], [0.95, 70, '120,220,255', 0.06], [1.3, 44, '200,150,255', 0.08], [1.75, 100, '120,255,220', 0.035]].forEach(([k, r, col, a]) => {
          const x = 1490 + vx * k, y = sy + vy * k;
          const hg = c.createRadialGradient(x, y, 0, x, y, r);
          hg.addColorStop(0, `rgba(${col},${a * fa * 0.4})`); hg.addColorStop(0.8, `rgba(${col},${a * fa})`); hg.addColorStop(1, `rgba(${col},0)`);
          c.fillStyle = hg; c.beginPath();
          for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; i ? c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r) : c.moveTo(x + r, y); }
          c.closePath(); c.fill();
        });
        c.restore();
      }
      // water droplets on the lens after the breach
      if (t > 2.15 && t < 4.6) {
        st.drops.forEach(d => {
          const age = t - 2.15 - d.d;
          if (age < 0) return;
          const a = 1 - seg(t, 3.6 + d.d, 4.5);
          const x = d.x, y = d.y + age * age * d.v, r = d.r;
          c.save(); c.globalAlpha = a;
          const dg = c.createRadialGradient(x, y + r * 0.2, r * 0.2, x, y, r);
          dg.addColorStop(0, 'rgba(255,255,255,0.05)'); dg.addColorStop(0.8, 'rgba(200,240,255,0.2)'); dg.addColorStop(1, 'rgba(20,80,130,0.4)');
          c.fillStyle = dg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.15, -0.6, 0, TAU); c.fill();
          c.restore();
        });
      }
      // breach splash
      const bs = seg(t, 2.1, 2.9);
      if (bs > 0 && bs < 1) {
        const r = rng(9);
        for (let k = 0; k < 40; k++) {
          const a = -Math.PI / 2 + (r() - 0.5) * 2.2, sp = 600 + r() * 1300, tt = bs * 0.8;
          const x = 960 + (r() - 0.5) * 1700 + Math.cos(a) * sp * tt, y = (FA_SURF - cy) + Math.sin(a) * sp * tt + 1800 * tt * tt;
          faBubble(c, x, y, (4 + r() * 12) * (1 - bs * 0.5), 1 - bs);
        }
      }
      const wf = t < 0.35 ? 1 - t / 0.35 : 0;
      if (wf > 0) { c.fillStyle = `rgba(230,250,255,${wf})`; c.fillRect(0, 0, W, H); }
      vignette(c, W, H, 0.22, '0,40,90');
    },
    score(A) {
      // underwater, muffled
      A.noise(0, { type: 'lowpass', f: 380, dur: 2.4, g: 0.14, hold: true, rel: 0.3 });
      A.chord(0, [48, 55, 59, 62, 64], { type: 'triangle', dur: 2.4, g: 0.04, a: 0.5, hold: true, rel: 0.3, lp: 650, rev: 0.6, width: 1 });
      A.osc(0.02, { f: 170, f2: 520, glide: 0.3, dur: 0.35, g: 0.12, lp: 1400 });
      [0.45, 0.8, 1.1, 1.35, 1.7, 1.95].forEach((t, i) => A.osc(t, { f: 260 + hash(i) * 400, f2: (260 + hash(i) * 400) * 2.4, glide: 0.07, dur: 0.11, g: 0.06, lp: 2200, pan: (hash(i + 4) - 0.5) }));
      A.noise(1.45, { type: 'lowpass', f: 300, f2: 3500, dur: 0.75, g: 0.13, swell: 0.92 });
      // breach
      A.noise(2.18, { type: 'highpass', f: 1500, dur: 0.6, g: 0.2, rev: 0.3 });
      A.noise(2.18, { type: 'bandpass', f: 700, q: 0.7, dur: 0.35, g: 0.2 });
      for (let k = 0; k < 9; k++) A.osc(2.3 + k * 0.07 + hash(k) * 0.05, { f: 2000 + hash(k + 2) * 2500, dur: 0.05, g: 0.025, pan: hash(k + 7) - 0.5, rev: 0.3 });
      // bright groove, 120 bpm
      const B0 = 2.2, bt = 0.5;
      const pad = (t, n, dur, g = 0.022) => A.chord(t, n, { type: 'sawtooth', dur, g, a: 0.25, hold: true, rel: 0.35, lp: 3200, spread: 9, rev: 0.45, width: 1.3 });
      pad(B0, [60, 64, 67, 71, 74], 2.0); pad(4.2, [53, 60, 64, 65, 69], 1.0); pad(5.2, [55, 62, 67, 69, 71], 1.0, 0.024);
      const marimba = (t, m, g = 0.07) => A.bell(t, midi(m), { g, dur: 0.6, ratios: [1, 3.95, 9.1], rev: 0.25, pan: ((m % 7) / 7 - 0.5) * 0.8 });
      const arpC = [72, 76, 79, 83, 86, 83, 79, 76], arpF = [69, 72, 76, 77, 81, 77, 76, 72], arpG = [71, 74, 79, 81, 83, 81, 79, 74];
      for (let k = 0; k < 16; k++) {
        const t = B0 + k * bt / 2;
        const seq = k < 8 ? arpC : arpC;
        marimba(t, seq[k % 8], 0.055);
      }
      for (let k = 0; k < 8; k++) marimba(4.2 + k * 0.25, (k < 4 ? arpF : arpG)[k % 8], 0.055);
      for (let n = 0; n < 8; n++) {
        const t = B0 + n * bt;
        A.kick(t, n === 0 ? 0.6 : 0.42, { f: 120, f2: 50, dur: 0.3 });
        if (n % 2) A.clap(t, 0.12, { rev: 0.2 });
        A.osc(t, { f: midi(n < 4 ? 36 : n < 6 ? 41 : 43), dur: 0.42, g: 0.15, a: 0.01 });
      }
      for (let k = 0; k < 32; k++) A.hat(B0 + k * 0.125, k % 2 ? 0.02 : 0.035, false, { f: 9000, pan: k % 2 ? 0.3 : -0.3 });
      // UI
      A.whoosh(3.05, 0.45, { f1: 500, f2: 3000, g: 0.08 });
      [3.5, 3.65, 3.8].forEach((t, i) => A.bell(t + 0.06, midi([96, 100, 103][i]), { g: 0.04, dur: 0.5, ratios: [1, 2.4] }));
      A.noise(4.6, { type: 'highpass', f: 3000, dur: 0.012, g: 0.18 });
      A.osc(4.6, { f: 1800, dur: 0.03, g: 0.05 });
      A.bell(4.64, midi(84), { g: 0.05, dur: 0.8 }); A.bell(4.72, midi(91), { g: 0.04, dur: 0.8 });
      A.whoosh(4.95, 0.4, { f1: 3000, f2: 600, g: 0.07 });
      // converge
      A.riser(5.0, 1.2, { g: 0.12, f: 220 });
      for (let k = 0; k < 12; k++) { const t = 5.0 + 1.15 * (1 - Math.pow(1 - k / 12, 1.6)); A.osc(t, { f: 300 + k * 60, f2: (300 + k * 60) * 2.2, glide: 0.05, dur: 0.08, g: 0.045, lp: 3000, pan: k % 2 ? 0.4 : -0.4 }); }
      // orb forms
      A.impact(FA_ORB, 0.45, { rev: 0.6 });
      pad(FA_ORB, [48, 60, 64, 67, 71, 74], 1.4, 0.028);
      [84, 91, 96, 100].forEach((m, i) => A.bell(FA_ORB + i * 0.03, midi(m), { g: 0.05, dur: 1.8, rev: 0.6 }));
      A.osc(FA_ORB + 0.05, { f: 320, f2: 420, glide: 0.2, dur: 0.5, g: 0.06, vib: [11, 30] });
      A.noise(FA_ORB, { type: 'highpass', f: 6000, dur: 1.2, g: 0.06, rev: 0.5 });
      for (let k = 0; k < 6; k++) { const t = FA_ORB + k * 0.25; marimba(t, [72, 76, 79, 84, 79, 76][k], 0.04); }
      // logo chime
      [72, 76, 79, 83, 86, 91].forEach((m, i) => A.bell(FA_LOGO + 0.1 + i * 0.09, midi(m), { g: 0.05, dur: 2.2, rev: 0.6, pan: (i / 5 - 0.5) }));
      A.chord(FA_LOGO + 0.1, [48, 55, 60, 64, 67, 71, 74], { type: 'triangle', dur: 2.3, g: 0.035, a: 0.15, hold: true, rel: 0.8, lp: 3000, rev: 0.6, width: 1.4 });
      A.osc(FA_LOGO + 0.1, { f: midi(36), dur: 2.2, g: 0.16, a: 0.02 });
      A.kick(FA_LOGO + 0.1, 0.5, { f: 110, f2: 45, dur: 0.4 });
      [100, 103, 108].forEach((m, i) => A.bell(8.45 + i * 0.07, midi(m), { g: 0.03, dur: 0.7 }));
    },
  });

  /* =====================================================================
     G3 · CRT TERMINAL → DIGITAL RAIN
     ===================================================================== */
  const TM_KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
  const TM_GLYPHS = [...(TM_KANA + '012345789Z:."=*+-<>|')];
  const TM_CW = 26, TM_CH = 32, TM_COLS = 74, TM_ROWS = 34;
  const TM_X = 140, TM_Y = 186, TM_LH = 72, TM_FS = 62;
  const TM_DIS = 4.1, TM_REV = 7.0, TM_LOCK = 8.4;
  const TM_GREEN = '#41ff7a';
  const TM_MSG = ['ARE YOU', 'AWAKE?'];
  const TM_SCRIPT = (() => {
    const L = [
      { k: 'out', t0: 0.55, s: 'PHOSPHOR BIOS v4.02      (C) 1999' },
      { k: 'mem', t0: 0.72, t1: 1.02 },
      { k: 'type', t0: 1.12, s: '> dial 555-0199 --carrier', cps: 34 },
      { k: 'bar', t0: 1.95, t1: 2.45, s: '  CARRIER   ', end: 100 },
      { k: 'type', t0: 2.6, s: '> open signal.dat', cps: 38 },
      { k: 'bar', t0: 3.02, t1: 3.3, s: '  DECODING  ', end: 99 },
      { k: 'print', t0: 3.36, s: '  !! THE SIGNAL IS NOT DATA. IT IS ALIVE.', cps: 105 },
    ];
    L.forEach((l, li) => {
      if (l.k !== 'type') return;
      let tt = l.t0;
      l.times = [...l.s].map((ch, i) => { if (i < 2) return l.t0 - 0.3; tt += (1 / l.cps) * (0.45 + 1.1 * hash(li * 50 + i)); return tt; });
      l.t1 = tt;
    });
    return L;
  })();
  function tmBar(l, t) {
    const pct = Math.floor(l.end * clamp((t - l.t0) / (l.t1 - l.t0)));
    const f = Math.floor(pct / 5);
    return `${l.s}[${'#'.repeat(f)}${'.'.repeat(20 - f)}] ${String(pct).padStart(3, ' ')}%`;
  }
  function tmLines(t) {
    const out = []; let cur = null;
    TM_SCRIPT.forEach((l, li) => {
      if (l.k === 'out') { if (t >= l.t0) { out.push(l.s); cur = { li, typing: false }; } }
      else if (l.k === 'mem') { if (t >= l.t0) { const n = Math.floor(65536 * E.outQ(seg(t, l.t0, l.t1))); out.push(`MEMORY TEST  ${String(n).padStart(5, ' ')}K${t >= l.t1 ? '  OK' : ''}`); cur = { li, typing: t < l.t1 }; } }
      else if (l.k === 'type') { const n = l.times.filter(x => x <= t).length; if (n) { out.push(l.s.slice(0, n)); cur = { li, typing: n < l.s.length }; } }
      else if (l.k === 'bar') { if (t >= l.t0) { out.push(tmBar(l, t)); cur = { li, typing: t < l.t1 }; } }
      else if (l.k === 'print') { const n = Math.floor((t - l.t0) * l.cps); if (n > 0) { out.push(l.s.slice(0, n)); cur = { li, typing: n < l.s.length }; } }
    });
    return { out, cur };
  }
  function tmAtlas() {
    const cw = 32, ch = 36, n = TM_GLYPHS.length;
    const { c, g } = mk(cw * n, ch * 3);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `500 27px ${JP}`;
    ['#2cff66', '#bfffcf', '#ffffff'].forEach((col, r) => {
      TM_GLYPHS.forEach((s, k) => {
        g.save(); g.translate(k * cw + cw / 2, r * ch + ch / 2 + 1); g.scale(-1.2, 1);
        if (r === 2) { g.shadowColor = '#b8ffc8'; g.shadowBlur = 3; }
        g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
      });
    });
    return { c, cw, ch, n };
  }
  function tmMask() {
    const { c, g } = mk(1920, 1080);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '900 290px Archivo';
    g.fillText(TM_MSG[0], 960, 460);
    g.fillText(TM_MSG[1], 960, 800);
    const d = g.getImageData(0, 0, 1920, 1080).data;
    const m = new Uint8Array(TM_COLS * TM_ROWS);
    let minC = 999, maxC = 0;
    for (let i = 0; i < TM_COLS; i++) for (let r = 0; r < TM_ROWS; r++) {
      const x = i * TM_CW + TM_CW / 2, y = r * TM_CH + TM_CH / 2;
      if (d[(y * 1920 + x) * 4 + 3] > 120) { m[i * TM_ROWS + r] = 1; minC = Math.min(minC, i); maxC = Math.max(maxC, i); }
    }
    const gl = mk(1920, 1080);
    gl.g.filter = 'blur(10px)'; gl.g.drawImage(c, 0, 0);
    gl.g.filter = 'none'; gl.g.globalCompositeOperation = 'source-in'; gl.g.fillStyle = '#2bff6a'; gl.g.fillRect(0, 0, 1920, 1080);
    return { m, minC, maxC, glow: gl.c };
  }
  const tmRevStart = (i, M) => TM_REV + (i - M.minC) / Math.max(1, M.maxC - M.minC) * 0.45 + hash(i * 3.3) * 0.2;
  const TM_RV = 44;

  MG.film({
    id: 'terminal', dur: 10, poster: 9.5,
    fonts: [['900 250px Archivo', 'AREYOUWAKE?'], ['400 62px VT323', 'PHOSPHOR BIOS MEMORY TEST dial open signal.dat CARRIER DECODING ARE YOU AWAKE? YES 0123456789#.[]%>!-'], ['500 27px "Noto Sans JP"', TM_GLYPHS.join('')]],
    meta: {
      family: 'G', name: 'CRT Terminal / Digital Rain', sub: 'Green Phosphor Code', era: '1999 —',
      origin: 'Green P1-phosphor monochrome terminals defined early computing screens; The Matrix (1999) turned them into myth with its cascading “digital rain” of mirrored katakana and numerals, designed by Simon Whiteley.',
      works: 'The Matrix (1999) title & code rain · WarGames (1983) · Alien (1979) MU-TH-UR screens · IBM 5151 monochrome display (1981)',
      tech: ['Typed command lines & block cursor', 'ASCII progress bars', 'Katakana rain, phosphor bloom, curved glass'],
      accent: '#39ff6e',
      motionDNA: 'Discrete, character-by-character time: typing, ticking bars, then cascades of falling glyphs that resolve into meaning.',
      visualDNA: 'Monochrome green phosphor on black with bloom, scanlines, barrel-curved glass and vignette; mirrored half-width katakana columns with white-hot heads.',
      transitions: 'CRT power-on, character scramble-and-fall, rain sweep reveal, glyph lock',
      implementation: ['After Effects', 'Canvas 2D', 'GLSL shaders'],
      reproducibility: 'Fully procedural', loopable: true,
    },
    setup() {
      const r = rng(1999);
      const cols = Array.from({ length: TM_COLS }, (_, i) => {
        const L = 10 + r() * 22;
        return { s: TM_DIS + 0.05 + r() * 0.7, y0: -r() * 10, v: 15 + r() * 17, L, per: L + 3 + r() * 12 };
      });
      const back = Array.from({ length: 140 }, () => { const L = 8 + r() * 20; return { s: TM_DIS + 0.2 + r() * 1.2, y0: -r() * 30, v: 6 + r() * 10, L, per: L + 4 + r() * 24 }; });
      const S = mk(1920, 1080);
      const pat = mk(3, 1);
      ['#ffd6d6', '#d6ffd6', '#d6d6ff'].forEach((col, i) => { pat.g.fillStyle = col; pat.g.fillRect(i, 0, 1, 1); });
      return { cols, back, S, T: mk(1920, 1080), B1: mk(480, 270), B2: mk(120, 68), pat };
    },
    draw(c, t, W, H, st) {
      if (!st.A) st.A = tmAtlas();
      if (!st.M) st.M = tmMask();
      if (!st.adv) { st.S.g.font = `400 ${TM_FS}px ${VT}`; st.adv = st.S.g.measureText('M').width; }
      const A = st.A, M = st.M, g = st.S.g, adv = st.adv;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#010502'; g.fillRect(0, 0, W, H);
      const glyph = (k, row, x, y, a, s = 1) => {
        if (a <= 0.01) return;
        g.globalAlpha = Math.min(1, a);
        const dw = A.cw * 0.82 * s, dh = A.ch * 0.82 * s;
        g.drawImage(A.c, k * A.cw, row * A.ch, A.cw, A.ch, x - dw / 2, y - dh / 2, dw, dh);
      };
      const gi = (seed) => Math.floor(hash(seed) * A.n) % A.n;
      // CRT power-on
      if (t < 0.5) {
        const a = seg(t, 0.03, 0.12), b = seg(t, 0.12, 0.3);
        if (t >= 0.03) {
          const w = W * E.outC(a), h = Math.max(4, H * E.outC(b));
          const fl = 1 - 0.92 * seg(t, 0.14, 0.5);
          g.fillStyle = `rgba(200,255,215,${fl})`; g.fillRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
        }
      }
      // terminal
      const zoom = 1 + 0.07 * E.ioS(seg(t, TM_DIS, 10));
      if (t < TM_DIS + 1.2) {
        const { out, cur } = tmLines(Math.min(t, TM_DIS));
        const push = 1 + 0.07 * E.ioS(seg(t, 0.5, TM_DIS + 0.4));
        g.save(); g.translate(TM_X, TM_Y); g.scale(push, push); g.translate(-TM_X, -TM_Y);
        if (t >= 0.5 && t < TM_DIS) {
          g.fillStyle = TM_GREEN; g.fillRect(TM_X - 12, 92, W - 2 * TM_X + 24, 54);
          text(g, ' PHOSPHOR/OS  ::  TTY1  ::  9600 BAUD  ::  NODE 0x1F', TM_X, 133, { font: VT, size: 46, color: '#021a08' });
          text(g, `00:${String(Math.floor(t * 10) % 60).padStart(2, '0')}:${String(Math.floor(t * 600) % 60).padStart(2, '0')} `, W - TM_X, 133, { font: VT, size: 46, color: '#021a08', align: 'right' });
        }
        if (t < TM_DIS) {
          out.forEach((s, i) => {
            const warn = s.startsWith('  !!');
            text(g, s, TM_X, TM_Y + i * TM_LH + TM_LH * 0.7, { font: VT, size: TM_FS, color: warn ? '#c8ffd4' : TM_GREEN });
          });
          if (cur) {
            const on = cur.typing || Math.floor(t * 2.6) % 2 === 0;
            const li = out.length - 1;
            if (on) { g.fillStyle = TM_GREEN; g.fillRect(TM_X + out[li].length * adv + 4, TM_Y + li * TM_LH + 8, adv * 0.9, TM_LH * 0.78); }
          }
        } else {
          // scramble, then fall
          out.forEach((s, li) => {
            [...s].forEach((ch, i) => {
              if (ch === ' ') return;
              const x = TM_X + i * adv + adv / 2, y0 = TM_Y + li * TM_LH + TM_LH * 0.45;
              const scr = TM_DIS + hash(li * 31 + i) * 0.22, fall = TM_DIS + 0.16 + hash(li * 17 + i * 3) * 0.45 + i * 0.004;
              if (t < scr) { text(g, ch, x, y0 + TM_LH * 0.25, { font: VT, size: TM_FS, color: TM_GREEN, align: 'center' }); return; }
              const k = gi(li * 97 + i * 13 + Math.floor(t * 20));
              const tf = Math.max(0, t - fall), dy = 0.5 * 2600 * tf * tf;
              if (y0 + dy > H + 60) return;
              for (let q = 3; q >= 1; q--) glyph(gi(li * 7 + i + q * 11), 0, x, y0 + dy - q * 30 * Math.min(1, tf * 6), 0.5 - q * 0.12, 1.6);
              glyph(k, tf > 0 ? 2 : 1, x, y0 + dy, 1, 1.6);
            });
          });
        }
        g.restore();
      }
      // digital rain
      if (t >= TM_DIS) {
        g.save();
        g.translate(W / 2, H / 2); g.scale(zoom, zoom); g.translate(-W / 2, -H / 2);
        const rainA = 1 - 0.86 * E.ioC(seg(t, TM_REV + 0.5, TM_LOCK + 0.4));
        const fr = Math.floor(t * 24);
        // back layer
        const bw = W / 140, bh = 18, brows = 61;
        st.back.forEach((C, i) => {
          if (t < C.s) return;
          const head0 = C.y0 + C.v * (t - C.s);
          const kmin = Math.max(0, Math.ceil((head0 - brows - C.L) / C.per));
          for (let k = kmin; head0 - k * C.per >= -1; k++) {
            const h = head0 - k * C.per;
            for (let r = Math.max(0, Math.ceil(h - C.L)); r <= Math.min(brows - 1, Math.floor(h)); r++) {
              const d = h - r;
              glyph(gi(i * 5.3 + r * 2.1 + Math.floor(t * (1 + hash(i + r) * 4))), d < 1 ? 1 : 0, i * bw + bw / 2, r * bh + bh / 2, 0.32 * Math.pow(1 - d / C.L, 1.4) * rainA, 0.6);
            }
          }
        });
        // front layer
        st.cols.forEach((C, i) => {
          if (t < C.s) return;
          const head0 = C.y0 + C.v * (t - C.s);
          const kmin = Math.max(0, Math.ceil((head0 - TM_ROWS - C.L) / C.per));
          const x = i * TM_CW + TM_CW / 2;
          for (let k = kmin; head0 - k * C.per >= -1; k++) {
            const h = head0 - k * C.per;
            for (let r = Math.max(0, Math.ceil(h - C.L)); r <= Math.min(TM_ROWS - 1, Math.floor(h)); r++) {
              if (M.m[i * TM_ROWS + r] && t >= tmRevStart(i, M) + r / TM_RV) continue;
              const d = h - r;
              const head = d < 1;
              const rate = hash(i * 1.7 + r * 3.1) < 0.2 ? 14 : 1 + hash(i + r * 9) * 3;
              const k2 = head ? gi(i * 7.1 + r * 3.3 + fr) : gi(i * 7.1 + r * 3.3 + Math.floor(t * rate));
              glyph(k2, head ? 2 : d < 2.2 ? 1 : 0, x, r * TM_CH + TM_CH / 2, (head ? 1 : Math.pow(1 - d / C.L, 1.5)) * rainA);
            }
          }
          // reveal sweep: a fast bright drop writes the message
          if (i >= M.minC && i <= M.maxC) {
            const s0 = tmRevStart(i, M), h = (t - s0) * TM_RV;
            if (h >= 0 && h - 14 < TM_ROWS) {
              for (let r = Math.max(0, Math.ceil(h - 14)); r <= Math.min(TM_ROWS - 1, Math.floor(h)); r++) {
                const d = h - r;
                glyph(gi(i * 3 + r * 5 + fr), d < 1 ? 2 : 1, x, r * TM_CH + TM_CH / 2, d < 1 ? 1 : 0.7 * Math.pow(1 - d / 14, 1.3));
              }
            }
          }
        });
        // phosphor silhouette of the message, revealed column by column behind the glyphs
        g.globalCompositeOperation = 'lighter';
        for (let i = M.minC - 1; i <= M.maxC + 1; i++) {
          const s0 = tmRevStart(clamp(i, M.minC, M.maxC), M), hy = (t - s0) * TM_RV * TM_CH;
          if (hy <= 0) continue;
          g.globalAlpha = 0.16 + 0.12 * Math.exp(-Math.max(0, t - TM_LOCK) * 3) * (t >= TM_LOCK ? 1 : 0);
          g.drawImage(M.glow, i * TM_CW, 0, TM_CW, Math.min(H, hy), i * TM_CW, 0, TM_CW, Math.min(H, hy));
        }
        g.globalCompositeOperation = 'source-over';
        // locked message cells
        for (let i = M.minC; i <= M.maxC; i++) {
          const s0 = tmRevStart(i, M);
          for (let r = 0; r < TM_ROWS; r++) {
            if (!M.m[i * TM_ROWS + r]) continue;
            const lt = s0 + r / TM_RV;
            if (t < lt) continue;
            const x = i * TM_CW + TM_CW / 2, y = r * TM_CH + TM_CH / 2;
            const flick = hash(i * 13 + r * 7 + Math.floor(t * 5)) < 0.08;
            const k = gi(i * 13 + r * 7 + (flick ? Math.floor(t * 5) : 0));
            glyph(k, 1, x, y, 1, 1.12);
            const fl = Math.exp(-(t - lt) * 7) + 0.6 * Math.exp(-Math.max(0, t - TM_LOCK) * 4) * (t >= TM_LOCK ? 1 : 0);
            glyph(k, 2, x, y, fl, 1.12);
          }
        }
        g.restore();
        // answer prompt
        if (t >= 8.65) {
          const typed = '> ' + 'YES'.slice(0, t < 8.9 ? 0 : t < 9.02 ? 1 : t < 9.14 ? 2 : 3);
          const tw = 6 * adv, x0 = W / 2 - tw / 2, y = 1000;
          text(g, typed, x0, y, { font: VT, size: TM_FS, color: '#c8ffd4' });
          if (t < 9.14 || Math.floor((t - 9.14) * 2.6) % 2 === 0) { g.fillStyle = '#c8ffd4'; g.fillRect(x0 + typed.length * adv + 4, y - TM_FS * 0.72, adv * 0.9, TM_FS * 0.82); }
        }
      }
      g.globalAlpha = 1;
      // phosphor bloom
      st.B1.g.clearRect(0, 0, 480, 270); st.B1.g.drawImage(st.S.c, 0, 0, 480, 270);
      st.B2.g.clearRect(0, 0, 120, 68); st.B2.g.drawImage(st.B1.c, 0, 0, 120, 68);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.8; g.drawImage(st.B1.c, 0, 0, W, H);
      g.globalAlpha = 0.5; g.drawImage(st.B2.c, 0, 0, W, H);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      // scanlines (before the curve so they bend with the glass)
      g.fillStyle = 'rgba(0,0,0,0.42)';
      for (let y = 0; y < H; y += 4) g.fillRect(0, y + 2, W, 2);
      const rb = ((t * 0.35) % 1.4 - 0.2) * H;
      const rbg = g.createLinearGradient(0, rb - 120, 0, rb + 120);
      rbg.addColorStop(0, 'rgba(80,255,130,0)'); rbg.addColorStop(0.5, 'rgba(80,255,130,0.035)'); rbg.addColorStop(1, 'rgba(80,255,130,0)');
      g.fillStyle = rbg; g.fillRect(0, rb - 120, W, 240);
      // barrel curvature
      const T = st.T.g;
      T.fillStyle = '#000'; T.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 4) {
        const dy = (y + 2 - H / 2) / (H / 2), k = 1 - 0.065 * dy * dy, w = W * k;
        T.drawImage(st.S.c, 0, y, W, 4, (W - w) / 2, y, w, 4);
      }
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 4) {
        const dx = (x + 2 - W / 2) / (W / 2), k = 1 - 0.075 * dx * dx, h = H * k;
        c.drawImage(st.T.c, x, 0, 4, H, x, (H - h) / 2, 4, h);
      }
      // aperture grille, flicker, vignette, glass
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = c.createPattern(st.pat.c, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = `rgba(0,0,0,${0.03 + 0.04 * hash(Math.floor(t * 30))})`; c.fillRect(0, 0, W, H);
      vignette(c, W, H, 0.75);
      c.save();
      const bz = new Path2D(); bz.rect(0, 0, W, H);
      { const x = 22, y = 18, w = W - 44, h = H - 36, r = 80; bz.moveTo(x + r, y); bz.arcTo(x + w, y, x + w, y + h, r); bz.arcTo(x + w, y + h, x, y + h, r); bz.arcTo(x, y + h, x, y, r); bz.arcTo(x, y, x + w, y, r); bz.closePath(); }
      c.fillStyle = '#000'; c.fill(bz, 'evenodd');
      c.strokeStyle = 'rgba(120,255,160,0.06)'; c.lineWidth = 3; rrect(c, 22, 18, W - 44, H - 36, 80); c.stroke();
      const gl = c.createLinearGradient(0, 0, W * 0.6, H * 0.7);
      gl.addColorStop(0, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.015)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; rrect(c, 22, 18, W - 44, H - 36, 80); c.fill();
      c.restore();
    },
    score(A) {
      // power-on
      A.noise(0.0, { type: 'highpass', f: 2000, dur: 0.02, g: 0.3 });
      A.osc(0.03, { f: 55, f2: 32, dur: 0.7, g: 0.4 });
      A.noise(0.04, { type: 'lowpass', f: 700, f2: 120, dur: 0.7, g: 0.22 });
      A.osc(0.05, { f: 60, dur: 9.9, g: 0.03, hold: true, rel: 0.4 });
      A.osc(0.05, { f: 120, dur: 9.9, g: 0.012, hold: true, rel: 0.4 });
      A.osc(0.1, { f: 9800, dur: 3.9, g: 0.004, hold: true, rel: 0.3 });
      A.osc(0.55, { type: 'square', f: 1000, dur: 0.15, g: 0.05, hold: true, rel: 0.01, lp: 3500 });
      for (let k = 0; k < 14; k++) A.noise(0.72 + k * 0.021, { type: 'highpass', f: 5000, dur: 0.008, g: 0.05 });
      // typing
      A.noise(0.5, { type: 'lowpass', f: 500, dur: 3.6, g: 0.03, hold: true, rel: 0.3 });
      const key = (t, g = 0.15) => {
        A.noise(t, { type: 'bandpass', f: 2600 + hash(t * 7) * 1800, q: 1.2, dur: 0.018, g });
        A.osc(t, { f: 190, f2: 90, dur: 0.035, g: g * 0.4 });
      };
      TM_SCRIPT.forEach(l => {
        if (l.k === 'type') { l.times.slice(2).forEach(x => key(x)); key(l.t1 + 0.12, 0.18); }
        if (l.k === 'bar') for (let p = 1; p <= Math.floor(l.end / 5); p++) A.osc(l.t0 + (p * 5 / l.end) * (l.t1 - l.t0), { type: 'square', f: 500 + p * 55, dur: 0.02, g: 0.03, hold: true, rel: 0.005, lp: 4000 });
        if (l.k === 'print') for (let i = 0; i < l.s.length; i += 2) A.noise(l.t0 + i / l.cps, { type: 'bandpass', f: 3500, q: 1, dur: 0.01, g: 0.05 });
      });
      for (let k = 0; k < 12; k++) A.osc(1.95 + k * 0.04, { type: 'square', f: k % 2 ? 1270 : 1070, dur: 0.04, g: 0.022, hold: true, rel: 0.005, lp: 3000 });
      A.noise(2.45, { type: 'bandpass', f: 1800, q: 2, dur: 0.12, g: 0.06 });
      A.osc(3.5, { type: 'square', f: 220, dur: 0.14, g: 0.05, hold: true, rel: 0.01, lp: 1500 });
      A.osc(3.68, { type: 'square', f: 175, dur: 0.2, g: 0.05, hold: true, rel: 0.01, lp: 1500 });
      // dissolve + fall
      A.noise(TM_DIS, { type: 'bandpass', f: 2500, q: 1, dur: 0.25, g: 0.14, crush: true, hold: true, rel: 0.02 });
      A.osc(TM_DIS, { type: 'square', f: 2200, f2: 70, glide: 0.6, dur: 0.6, g: 0.05, lp: 3000 });
      A.whoosh(TM_DIS + 0.15, 0.8, { f1: 4000, f2: 250, g: 0.14 });
      A.impact(TM_DIS + 0.55, 0.55);
      // the rain
      A.chord(TM_DIS + 0.3, [38, 45, 50, 53, 57], { type: 'sawtooth', dur: 4.3, g: 0.018, a: 1.2, hold: true, rel: 0.5, lp: 650, spread: 12, rev: 0.6, width: 1.4 });
      for (let k = 0; k < 24; k++) { const t = TM_DIS + 0.5 + k * 0.25; if (t > TM_REV + 0.2) break; A.osc(t, { f: midi(26), dur: 0.2, g: k % 4 === 0 ? 0.16 : 0.09, lp: 300 }); }
      const pent = [74, 77, 79, 81, 84, 86, 89, 91];
      for (let k = 0; k < 44; k++) {
        const t = TM_DIS + 0.45 + k * 0.072 + hash(k * 3.1) * 0.05;
        if (t > TM_REV + 0.4) break;
        const f = midi(pent[Math.floor(hash(k * 7.7) * pent.length)]);
        A.osc(t, { f, f2: f * 0.8, glide: 0.25, dur: 0.28, g: 0.022, rev: 0.6, pan: hash(k + 11) * 1.6 - 0.8 });
      }
      A.riser(TM_REV - 0.6, 0.8, { g: 0.12, f: 73 });
      // reveal
      A.whoosh(TM_REV, 0.9, { f1: 6000, f2: 800, g: 0.1 });
      for (let k = 0; k < 28; k++) A.osc(TM_REV + k * 0.045, { type: 'square', f: midi(pent[k % pent.length] + 12), dur: 0.03, g: 0.012, hold: true, rel: 0.01, lp: 6000, pan: (k / 27 - 0.5) * 1.4, rev: 0.3 });
      A.impact(TM_LOCK, 0.7, { rev: 0.7 });
      A.chord(TM_LOCK, [38, 50, 57, 62, 64, 65], { type: 'sawtooth', dur: 1.6, g: 0.022, a: 0.05, hold: true, rel: 0.9, lp: 1800, spread: 10, rev: 0.7, width: 1.4 });
      A.bell(TM_LOCK, midi(86), { g: 0.06, dur: 2.2, rev: 0.7 });
      A.bell(TM_LOCK + 0.04, midi(93), { g: 0.035, dur: 2, rev: 0.7 });
      // answer
      [8.9, 9.02, 9.14].forEach(t => key(t, 0.14));
    },
  });
})();
