/* batch g1 — Family A: Graphic Design & Historical. Dadaism · Mid-century Modern · Grunge Typography. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, roughPoly, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Abril+Fatface&family=UnifrakturMaguntia&family=Oswald:wght@500;700&family=Special+Elite&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Yellowtail&family=Josefin+Sans:wght@400;700&family=Anton&family=Rock+Salt&family=Courier+Prime:wght@400;700&family=Libre+Bodoni:ital,wght@1,700&display=block');
  const PI = Math.PI;

  // Keyframed rectangle: keys [[t, cx, cy, w, h], ...], snappy exponential in-out between keys.
  const kRect = (t, keys) => [1, 2, 3, 4].map(j => kf(t, keys.map((k, i) => (i ? [k[0], k[j], E.ioX] : [k[0], k[j]]))));

  /* =====================================================================
     DADAISM — Richter's Rhythmus 21 opens it: white and grey rectangles
     breathe on black and the frame inverts once; they iris into a
     Duchamp rotorelief that spins its eccentric circles, then a spiral of
     Hugo Ball's Karawane; a torn sheet rises, Arp's squares fall where
     chance drops them, a halftone mechanical head slides in and the sound
     poem is slammed down in mismatched wood type; chance re-rolls every
     font and angle, the page is blown clean and DADA is set letter by
     letter in four different faces
     ===================================================================== */
  const DA = { paper: '#e6d9bd', ink: '#16130f', red: '#c3271b', grey: '#8a8477', lgrey: '#b8b1a2', blk: '#0c0b0a', white: '#f2ece0' };
  const DA_F = { slab: '"Alfa Slab One", serif', fat: '"Abril Fatface", serif', frak: '"UnifrakturMaguntia", serif', cond: 'Oswald, sans-serif', type: '"Special Elite", monospace', old: '"Old Standard TT", serif' };
  const DA_FACES = [[DA_F.slab, 400, ''], [DA_F.fat, 400, ''], [DA_F.frak, 400, ''], [DA_F.cond, 700, ''], [DA_F.type, 400, ''], [DA_F.old, 400, 'italic']];
  const DA_T = { iris: 1.42, text: 2.62, paper: 3.4, head: 3.95, words: 4.35, type: 5.55, chaos: 6.45, blow: 7.3, title: 7.55, ism: 8.3, cap: 8.5 };
  // Rhythmus 21: four planes that grow, slide and collapse (cx, cy, w, h).
  const DA_RH = [
    { col: DA.white, k: [[0.05, 960, 540, 0, 0], [0.4, 960, 540, 560, 560], [0.72, 700, 540, 560, 560], [1.05, 700, 470, 300, 820], [1.42, 960, 540, 0, 0]] },
    { col: DA.grey, k: [[0.3, 2300, 540, 620, 380], [0.62, 1330, 600, 620, 380], [0.95, 1380, 320, 420, 240], [1.42, 960, 540, 0, 0]] },
    { col: DA.lgrey, k: [[0.5, 960, 1300, 1500, 110], [0.82, 960, 880, 1500, 110], [1.15, 960, 900, 1800, 36], [1.42, 960, 540, 0, 0]] },
    { col: DA.white, k: [[0.8, 1520, 820, 0, 0], [0.98, 1520, 820, 170, 170], [1.28, 380, 260, 170, 170], [1.42, 960, 540, 0, 0]] },
  ];
  // Karawane (Hugo Ball, 1916), set as it was in the 1920 Dada Almanach: every word its own face.
  const DA_W = [
    { s: 'KARAWANE', f: 0, size: 128, x: 690, y: 250, r: -0.035, col: DA.ink },
    { s: 'jolifanto bambla', f: 5, size: 78, x: 712, y: 362, r: 0.025, col: DA.ink },
    { s: 'ô falli', f: 2, size: 124, x: 1300, y: 470, r: -0.14, col: DA.red },
    { s: 'GROSSIGA', f: 3, size: 120, x: 706, y: 520, r: 0.0, col: DA.ink },
    { s: "m'pfa habla horem", f: 4, size: 52, x: 760, y: 604, r: 0.07, col: DA.ink },
    { s: 'égiga goramen', f: 1, size: 96, x: 690, y: 722, r: -0.05, col: DA.ink },
    { s: 'higo bloiko russula huju', f: 5, size: 46, x: 720, y: 800, r: 0.0, col: DA.ink },
    { s: 'hollaka', f: 0, size: 76, x: 1360, y: 690, r: 0.12, col: DA.ink },
    { s: 'BUNG BLAGO', f: 3, size: 150, x: 1040, y: 960, r: -0.2, col: DA.red },
  ];
  const DA_WAT = DA_W.map((_, i) => DA_T.words + i * 0.13);
  // Arp, "according to the laws of chance": torn squares dropped from above.
  const DA_SQ = (() => {
    const r = rng(1916), cols = [DA.ink, DA.grey, DA.red, DA.lgrey, 'news', DA.ink, DA.grey, 'news'];
    return cols.map((col, i) => ({ col, x: 600 + r() * 1250, y: 140 + r() * 820, w: 110 + r() * 170, h: 90 + r() * 150, r0: (r() - 0.5) * 3, r1: (r() - 0.5) * 0.9, at: DA_T.paper + 0.25 + i * 0.07 + r() * 0.06, seed: 40 + i }));
  })();
  const DA_DISC = [1710, 215, 150];
  const DA_TITLE = [['D', 0, DA.ink, 370, -0.03, 0], ['A', 1, DA.red, 430, 0.06, 14], ['D', 5, DA.ink, 400, -0.07, -10], ['A', 3, DA.ink, 420, 0.04, 6]];

  // Rotorelief: eccentric circles turning about the disc centre read as a pulsing cone.
  function daRotor(c, x, y, R, a, mode, tint) {
    c.save(); c.translate(x, y);
    c.fillStyle = DA.white; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.rotate(a);
    if (mode === 'spiral') {
      const n = 11;
      c.strokeStyle = DA.ink; c.lineWidth = R * 0.026;
      for (let i = 0; i < n; i++) {
        const rr = R * (0.96 - i * 0.085), off = (R * 0.96 - rr) * 0.42;
        c.beginPath(); c.arc(off, 0, rr, 0, TAU); c.stroke();
      }
      c.fillStyle = tint || DA.ink; c.beginPath(); c.arc((R * 0.96 - R * 0.07) * 0.42, 0, R * 0.07, 0, TAU); c.fill();
    } else {
      // Anémic Cinéma: a pun spirals inward around the disc
      const s = 'jolifanto bambla ô falli bambla grossiga m’pfa habla horem égiga goramen higo bloiko russula huju · ';
      c.fillStyle = DA.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
      let th = 0;
      for (let i = 0; i < s.length; i++) {
        const rr = R * 0.9 - th * R * 0.032;
        if (rr < R * 0.16) break;
        const fs = Math.max(10, rr * 0.13);
        c.font = `400 ${fs}px ${DA_F.type}`;
        c.save(); c.rotate(th); c.translate(0, -rr); c.fillText(s[i], 0, 0); c.restore();
        th += (c.measureText(s[i]).width + fs * 0.08) / rr;
      }
      c.fillStyle = tint || DA.red; c.beginPath(); c.arc(0, 0, R * 0.12, 0, TAU); c.fill();
    }
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke();
  }
  function daGear(c, x, y, r, teeth, a, col) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath();
    for (let k = 0; k < teeth * 4; k++) {
      const q = k % 4, rr = q === 1 || q === 2 ? r : r * 0.8, th = (k / (teeth * 4)) * TAU;
      c.lineTo(Math.cos(th) * rr, Math.sin(th) * rr);
    }
    c.closePath(); c.moveTo(r * 0.3, 0); c.arc(0, 0, r * 0.3, 0, TAU, true);
    c.fillStyle = col; c.fill('evenodd');
    c.restore();
  }
  // The printer's manicule, built from rounded bars.
  function daHand(c, x, y, s, a, col) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    c.fillStyle = col;
    c.fillRect(-150, -34, 46, 68);
    rrect(c, -100, -40, 120, 84, 22); c.fill();
    rrect(c, -10, -40, 160, 30, 15); c.fill();
    [[-4, -6], [-10, 14], [-18, 32]].forEach(([dx, dy]) => { rrect(c, dx, dy, 52, 22, 11); c.fill(); });
    c.fillStyle = DA.paper; c.fillRect(-150, -6, 46, 4);
    c.restore();
  }
  function daFit(c, s, face, size, maxW) {
    c.font = `${face[2]} ${face[1]} ${size}px ${face[0]}`;
    const w = c.measureText(s).width;
    return w > maxW ? size * maxW / w : size;
  }

  MG.film({
    id: 'dadaism', dur: 10, poster: 9.4,
    fonts: [['400 200px "Alfa Slab One"', 'DADAKARWNE'], ['400 200px "Abril Fatface"', 'Dégiaormn'], ['400 200px "UnifrakturMaguntia"', 'Aôfali'], ['700 200px Oswald', 'DAGROSIBUNLTHEM'], ['400 40px "Special Elite"', 'CABRETVOLIZÜH1916—'], ['italic 400 60px "Old Standard TT"', 'jolifantbm'], ['400 40px "Old Standard TT"', 'BALHÖCUSMNTWIERP']],
    meta: {
      family: 'A', name: 'Dadaism', sub: 'Anti-Art, Chance and Sound Poetry', era: '1916 — 1924',
      origin: 'Born at the Cabaret Voltaire in Zürich in February 1916, where Hugo Ball, Emmy Hennings, Tristan Tzara, Marcel Janco, Richard Huelsenbeck and Hans Arp staged sound poems, noise music and masks as a revolt against the logic that had produced the First World War. Berlin Dada (Raoul Hausmann, Hannah Höch, John Heartfield) invented political photomontage, Kurt Schwitters built Merz collages from rubbish in Hanover, and Hans Richter, Viking Eggeling and Marcel Duchamp carried it into abstract film.',
      works: 'Karawane (Hugo Ball, sound poem, 1916) · Cut with the Kitchen Knife Dada … (Hannah Höch, 1919–20) · Mechanical Head (Raoul Hausmann, c. 1920) · Squares Arranged According to the Laws of Chance (Hans Arp, 1916–17) · Rhythmus 21 (Hans Richter, 1921) · Anémic Cinéma (Marcel Duchamp, 1926) · Merz magazine (Kurt Schwitters, 1923–32)',
      tech: ['Keyframed Rhythmus planes with one inversion', 'Rotating eccentric-circle rotorelief', 'Seeded chance drops and re-rolls', 'Mixed wood-type setting per word'],
      accent: '#c3271b',
      motionDNA: 'Deliberately unreasonable: abstract rectangles breathe and collapse, discs spin hypnotically, cut-outs fall where chance puts them, words slam down crooked and then re-roll their faces and angles on every eighth note before being blown off the page.',
      visualDNA: 'Yellowed newsprint, black and one red, halftone photo cut-outs with scissor edges, gears and printers’ hands, and every word in a different wood or metal type, set at angles, in mismatched sizes, never on a grid.',
      transitions: 'Rhythmus collapse to iris, rotorelief cut, torn-sheet rise, chance drop, word slam, page blow-out, letter-by-letter title set',
      implementation: ['Physical photomontage and letterpress', '16 mm animation stand (Richter, Duchamp)', 'After Effects cut-outs', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1916);
      // yellowed newsprint with foxing, fibres and a fold
      const paper = offscreen(W, H + 60), p = paper.getContext('2d');
      p.fillStyle = DA.paper; p.fillRect(0, 0, W, H + 60);
      for (let k = 0; k < 14000; k++) { p.fillStyle = r() < 0.6 ? `rgba(110,85,50,${0.03 + r() * 0.06})` : 'rgba(255,250,235,0.3)'; p.fillRect(r() * W, r() * (H + 60), 1 + r() * 2, 1 + r() * 1.5); }
      for (let k = 0; k < 40; k++) {
        const x = r() * W, y = r() * H, rr = 20 + r() * 120, g = p.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, `rgba(150,105,50,${0.04 + r() * 0.06})`); g.addColorStop(1, 'rgba(150,105,50,0)');
        p.fillStyle = g; p.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      const fg = p.createLinearGradient(1010, 0, 1050, 0);
      fg.addColorStop(0, 'rgba(90,70,40,0)'); fg.addColorStop(0.5, 'rgba(90,70,40,0.09)'); fg.addColorStop(1, 'rgba(255,250,235,0)');
      p.fillStyle = fg; p.fillRect(1010, 0, 40, H + 60);
      const pv = p.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
      pv.addColorStop(0, 'rgba(120,85,40,0)'); pv.addColorStop(1, 'rgba(120,85,40,0.22)');
      p.fillStyle = pv; p.fillRect(0, 0, W, H + 60);
      // newsprint scrap: tiny columns of grey "text"
      const news = offscreen(300, 260), n = news.getContext('2d');
      n.fillStyle = '#d9d2c1'; n.fillRect(0, 0, 300, 260);
      n.fillStyle = 'rgba(40,35,30,0.55)';
      for (let col = 0; col < 3; col++) for (let y = 12; y < 250; y += 9) { const w = 80 * (0.6 + r() * 0.4); if (r() > 0.06) n.fillRect(8 + col * 98, y, w, 4); }
      n.font = '700 30px serif'; n.fillStyle = 'rgba(20,18,15,0.9)'; n.fillText('NEUE ZÜRCHER', 10, 34);
      // halftone mechanical head: a profile cut-out printed in a coarse screen
      const head = offscreen(620, 760), h = head.getContext('2d');
      const prof = [[110, 300], [150, 150], [260, 70], [390, 96], [452, 190], [460, 270], [520, 350], [470, 378], [488, 410], [462, 428], [478, 452], [450, 500], [372, 540], [384, 680], [400, 760], [150, 760], [176, 600], [118, 470]];
      roughPoly(h, prof, 77, 3, 22);
      h.fillStyle = '#efe8d8'; h.fill();
      h.save(); h.clip();
      h.fillStyle = '#cfc6b3'; h.fillRect(0, 0, 620, 760);
      h.fillStyle = '#1a1712';
      const ang = 0.785, ca = Math.cos(ang), sa = Math.sin(ang), sp = 9;
      for (let v = -800; v < 800; v += sp) for (let u = -800; u < 800; u += sp) {
        const x = 310 + u * ca - v * sa, y = 380 + u * sa + v * ca;
        if (x < -10 || x > 630 || y < -10 || y > 770) continue;
        // light from the front-right: dark nape and hair, bright cheek
        let d = 0.15 + 0.65 * clamp((330 - x) / 280) + 0.25 * clamp((y - 560) / 200) + (y < 190 ? 0.45 : 0);
        d += 0.3 * Math.exp(-((x - 400) ** 2 + (y - 250) ** 2) / 900) - 0.25 * Math.exp(-((x - 430) ** 2 + (y - 330) ** 2) / 2600);
        const rr = clamp(d) * sp * 0.62;
        if (rr > 0.4) { h.beginPath(); h.arc(x, y, rr, 0, TAU); h.fill(); }
      }
      h.restore();
      roughPoly(h, prof, 77, 3, 22); h.strokeStyle = 'rgba(20,18,14,0.6)'; h.lineWidth = 2; h.stroke();
      // a typewritten tape stuck across the cheek
      h.save(); h.translate(300, 430); h.rotate(-0.1); h.fillStyle = '#f4efe1'; h.fillRect(-120, -22, 250, 44);
      h.font = `400 26px ${DA_F.type}`; h.fillStyle = DA.ink; h.textBaseline = 'middle'; h.fillText('22', -100, 2); h.restore();
      return { paper, news, head };
    },
    draw(c, t, W, H, st) {
      // ---------- 1. Rhythmus 21 ----------
      if (t < DA_T.iris + 0.4) {
        c.fillStyle = DA.blk; c.fillRect(0, 0, W, H);
        DA_RH.forEach(R => {
          const [x, y, w, h] = kRect(t, R.k);
          if (w < 1 || h < 1) return;
          c.fillStyle = R.col; c.fillRect(x - w / 2, y - h / 2, w, h);
        });
        // one inversion, exactly as Richter flipped his negative
        if (t > 0.98 && t < 1.22) { c.save(); c.globalCompositeOperation = 'difference'; c.fillStyle = '#f2ece0'; c.fillRect(0, 0, W, H); c.restore(); }
      }
      // ---------- 2. the rotorelief ----------
      const discOn = t >= DA_T.iris;
      if (discOn && t < DA_T.paper + 0.5) {
        if (t >= DA_T.iris + 0.4) {
          c.fillStyle = DA.blk; c.fillRect(0, 0, W, H);
          vignette(c, W, H, 0.5);
        }
      }
      // ---------- 3. the page ----------
      const pu = E.outQt(seg(t, DA_T.paper, DA_T.paper + 0.45));
      const blow = E.inQ(seg(t, DA_T.blow, DA_T.blow + 0.38));
      const chaos = t >= DA_T.chaos && t < DA_T.blow + 0.4;
      const ck = chaos ? Math.floor((t - DA_T.chaos) * 8) : -1;
      if (pu > 0) {
        const py = lerp(H + 40, 0, pu);
        c.save();
        // camera shake during the chance section
        if (chaos) {
          const sh = 6 + 10 * seg(t, DA_T.chaos, DA_T.blow);
          c.translate(W / 2 + vnoise(t * 14, 3) * sh, H / 2 + vnoise(t * 14, 8) * sh); c.rotate(vnoise(t * 6, 5) * 0.012); c.translate(-W / 2, -H / 2);
        }
        // torn top edge of the sheet as it rises
        c.save();
        if (pu < 1) { roughPoly(c, [[-20, py], [W + 20, py - 18], [W + 20, H + 80], [-20, H + 80]], 9, 9, 30); c.clip(); }
        c.drawImage(st.paper, 0, py - 30);
        c.translate(0, py);

        // Arp's squares: they fall, flutter, and stay where they land
        DA_SQ.forEach((S, i) => {
          const u = seg(t, S.at, S.at + 0.42);
          if (u <= 0) return;
          const fall = E.inQ(u), land = u >= 1 ? E.outB(seg(t, S.at + 0.42, S.at + 0.6), 3) : 0;
          let x = S.x + Math.sin(u * 5 + i) * 40 * (1 - u), y = lerp(-300, S.y, fall), a = lerp(S.r0, S.r1, E.outQ(u)), s = 1 + (1 - land) * 0.04 * (u >= 1);
          if (chaos && ck > 0) { x += (hash(i * 7 + ck) - 0.5) * 120; y += (hash(i * 11 + ck) - 0.5) * 80; a += (hash(i * 3 + ck) - 0.5) * 0.8; }
          if (blow > 0) { const dx = x - 960, dy = y - 540, d = Math.hypot(dx, dy) || 1; x += dx / d * blow * 1600; y += dy / d * blow * 1600; a += blow * (i % 2 ? 3 : -3); }
          c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
          c.fillStyle = 'rgba(40,25,10,0.18)';
          roughPoly(c, [[-S.w / 2 + 6, -S.h / 2 + 8], [S.w / 2 + 6, -S.h / 2 + 8], [S.w / 2 + 6, S.h / 2 + 8], [-S.w / 2 + 6, S.h / 2 + 8]], S.seed, 3, 18); c.fill();
          roughPoly(c, [[-S.w / 2, -S.h / 2], [S.w / 2, -S.h / 2], [S.w / 2, S.h / 2], [-S.w / 2, S.h / 2]], S.seed, 3, 18);
          if (S.col === 'news') { c.save(); c.clip(); c.drawImage(st.news, -S.w / 2, -S.h / 2, S.w * 1.05, S.h * 1.05); c.restore(); }
          else { c.fillStyle = S.col; c.fill(); }
          c.restore();
        });

        // the mechanical head slides in with its gear
        const hu = E.outQt(seg(t, DA_T.head, DA_T.head + 0.5));
        if (hu > 0) {
          let hx = lerp(-700, 40, hu), hy = 250, ha = -0.03;
          if (chaos && ck > 0) { hx += (hash(ck * 5) - 0.5) * 60; ha += (hash(ck * 9) - 0.5) * 0.14; }
          if (blow > 0) { hx -= blow * 1400; ha -= blow * 1.5; }
          c.save(); c.translate(hx + 310, hy + 380); c.rotate(ha); c.translate(-310, -380);
          c.fillStyle = 'rgba(40,25,10,0.2)'; c.fillRect(14, 16, 0, 0);
          c.drawImage(st.head, 0, 0);
          daGear(c, 250, 210, 92, 12, t * 2.2, DA.ink);
          daGear(c, 372, 150, 52, 9, -t * 3.6, DA.red);
          c.restore();
        }

        // the sound poem, slammed down word by word
        DA_W.forEach((Wd, i) => {
          const at = DA_WAT[i], u = seg(t, at, at + 0.16);
          if (u <= 0) return;
          let face = DA_FACES[Wd.f], x = Wd.x, y = Wd.y, a = Wd.r, s = lerp(1.7, 1, E.outQt(u)), col = Wd.col;
          if (chaos && ck >= 0) {
            face = DA_FACES[(hash(i * 13 + ck * 7) * 6) | 0];
            a += (hash(i * 5 + ck) - 0.5) * 0.5; x += (hash(i * 17 + ck) - 0.5) * 90; y += (hash(i * 19 + ck) - 0.5) * 70;
            s *= 0.85 + hash(i * 23 + ck) * 0.4;
            if (hash(i * 29 + ck) > 0.75) col = col === DA.red ? DA.ink : DA.red;
          }
          if (blow > 0) { const dx = x - 700, dy = y - 540, d = Math.hypot(dx, dy) || 1; x += dx / d * blow * 1500 + blow * 400; y += dy / d * blow * 1500; a += blow * (i % 2 ? 2 : -2); }
          c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
          c.globalAlpha = Math.min(1, u * 3);
          const fs = daFit(c, Wd.s, face, Wd.size, 1100);
          text(c, Wd.s, 0, 0, { font: face[0], weight: face[1], style: face[2], size: fs, color: col });
          c.restore();
        });
        c.globalAlpha = 1;

        // a typewritten manifesto line types itself out
        const tl = 'DADA NE SIGNIFIE RIEN.  — TZARA, 1918';
        const nch = Math.floor(seg(t, DA_T.type, DA_T.type + 0.75) * tl.length);
        if (nch > 0 && blow < 1) {
          c.save(); c.translate(700 - blow * 900, 1040); c.rotate(-0.012);
          text(c, tl.slice(0, nch), 0, 0, { font: DA_F.type, size: 34, color: DA.ink, ls: 2 });
          c.restore();
        }
        // the printer's hand points at the poem
        const mu = E.outB(seg(t, DA_T.type + 0.2, DA_T.type + 0.45), 2);
        if (mu > 0 && blow < 1) daHand(c, 520 - blow * 1200, 900 + Math.sin(t * 9) * 4, 0.9 * mu, -0.12, DA.ink);
        c.restore();

        // ---------- 4. the title ----------
        if (t >= DA_T.title - 0.1) {
          // a red Arp square and a black rule anchor the setting
          const bu = E.outQt(seg(t, DA_T.title - 0.1, DA_T.title + 0.25));
          c.save(); c.translate(960, 520); c.rotate(-0.08); c.scale(bu, bu);
          c.fillStyle = DA.red; roughPoly(c, [[-330, -250], [300, -270], [320, 170], [-320, 190]], 33, 4, 24); c.fill();
          c.restore();
          const ru = E.outQt(seg(t, DA_T.title + 0.6, DA_T.title + 0.9));
          c.save(); c.translate(80, 690); c.rotate(-0.035);
          c.fillStyle = DA.ink; c.fillRect(0, 0, 1180 * ru, 20); c.restore();
          let x = 130;
          DA_TITLE.forEach(([ch, fi, col, size, a, dy], i) => {
            const face = DA_FACES[fi], at = DA_T.title + i * 0.17, u = seg(t, at, at + 0.14);
            c.font = `${face[2]} ${face[1]} ${size}px ${face[0]}`;
            const w = c.measureText(ch).width;
            if (u > 0) {
              const s = lerp(2.2, 1, E.outQt(u)), wob = t < at + 0.4 ? Math.sin((t - at) * 60) * 0.03 * (1 - seg(t, at, at + 0.4)) : 0;
              c.save(); c.translate(x + w / 2, 640 + dy); c.rotate(a + wob); c.scale(s, s);
              c.globalAlpha = Math.min(1, u * 2.5);
              const cc = col;
              text(c, ch, 0, 0, { font: face[0], weight: face[1], style: face[2], size, color: cc, align: 'center' });
              c.restore();
            }
            x += w * 0.94;
          });
          c.globalAlpha = 1;
          // -ISM on a white slip, pasted crooked
          const iu = E.outB(seg(t, DA_T.ism, DA_T.ism + 0.2), 2.4);
          if (iu > 0) {
            c.save(); c.translate(x + 120, 470); c.rotate(0.14); c.scale(iu, iu);
            c.fillStyle = 'rgba(40,25,10,0.25)'; c.fillRect(-118, -78, 250, 150);
            c.fillStyle = DA.white; roughPoly(c, [[-125, -86], [122, -82], [120, 66], [-122, 62]], 51, 2.5, 20); c.fill();
            text(c, 'ism', 0, 30, { font: DA_F.old, style: 'italic', weight: 400, size: 120, color: DA.red, align: 'center' });
            c.restore();
          }
          const cap = (s, x0, y0, at, o) => {
            const n = Math.floor(seg(t, at, at + 0.5) * s.length); if (n <= 0) return;
            text(c, s.slice(0, n), x0, y0, { color: DA.ink, ...o });
          };
          cap('CABARET VOLTAIRE  ·  ZÜRICH  ·  1916 —', 132, 776, DA_T.cap, { font: DA_F.type, size: 40, ls: 3 });
          cap('BALL · HÖCH · HAUSMANN · ARP · SCHWITTERS · RICHTER · DUCHAMP', 134, 830, DA_T.cap + 0.25, { font: DA_F.old, size: 30, ls: 3 });
          const tu = E.outQt(seg(t, DA_T.cap + 0.1, DA_T.cap + 0.5));
          if (tu > 0) {
            c.save(); c.globalAlpha = tu; c.translate(132, 150); c.rotate(-0.02);
            text(c, 'THE MOTION STYLE ATLAS', 0, 0, { font: DA_F.cond, weight: 700, size: 40, ls: 6, color: DA.ink });
            text(c, 'Family A', 560, 2, { font: DA_F.old, style: 'italic', size: 46, color: DA.red });
            c.restore();
          }
          const hu2 = E.outQt(seg(t, DA_T.cap + 0.35, DA_T.cap + 0.7));
          if (hu2 > 0) daHand(c, lerp(-200, 1060, hu2), 960, 0.75, 0.02, DA.ink);
          if (hu2 > 0) text(c, 'ANTI-ART', 1180, 976, { font: DA_F.slab, size: 50, color: DA.ink, ls: 4 });
          const hd = E.outQt(seg(t, DA_T.title + 0.4, DA_T.title + 1.0));
          if (hd > 0) {
            c.save(); c.translate(lerp(2400, 1410, hd), 340); c.rotate(0.05); c.scale(0.95, 0.95);
            c.drawImage(st.head, 0, 0);
            daGear(c, 250, 210, 92, 12, t * 1.2, DA.ink);
            daGear(c, 372, 150, 52, 9, -t * 2, DA.red);
            c.restore();
          }
        }
        c.restore();
      }

      // ---------- the rotorelief, on top: big in section 2, small on the poster ----------
      if (discOn) {
        const ir = E.outB(seg(t, DA_T.iris, DA_T.iris + 0.38), 1.6);
        const sh = E.ioX(seg(t, DA_T.paper + 0.1, DA_T.paper + 0.6));
        const out = t > DA_T.blow ? E.inQ(seg(t, DA_T.blow, DA_T.blow + 0.35)) : 0;
        const back = E.outB(seg(t, DA_T.title + 0.7, DA_T.title + 1.1), 1.5);
        let [x, y, R] = [lerp(960, DA_DISC[0], sh), lerp(540, DA_DISC[1], sh), lerp(420 * ir, DA_DISC[2], sh)];
        if (out > 0) { x = lerp(x, 2300, out); }
        if (t > DA_T.title + 0.7) { x = lerp(2300, 1560, back); y = 250; R = 190; }
        if (R > 1 && x < 2250) {
          const mode = t > DA_T.text && t < DA_T.paper + 0.05 ? 'text' : 'spiral';
          daRotor(c, x, y, R, t * TAU * (mode === 'text' ? -0.35 : 0.6), mode, t > DA_T.paper ? DA.red : null);
        }
      }
      grain(c, W, H, t, 0.04, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // detuned cabaret piano (Karplus–Strong body and a sine core)
      const pno = (t, m, g = 0.1, dur = 1.6, o = {}) => {
        A.pluck(t, midi(m), { dur, g: g * 1.2, bright: 0.45, decay: 0.995, lp: 3000, rev: o.rev ?? 0.3, pan: o.pan || 0 });
        A.osc(t, { f: midi(m) * 1.004, dur: dur * 0.7, g: g * 0.4, a: 0.003, rev: 0.3, pan: o.pan || 0 });
      };
      // Ball's chant: a buzzing voice with two vowel formants
      const voice = (t, m, dur, f1, f2, g = 0.06, pan = 0) => {
        A.osc(t, { type: 'sawtooth', f: midi(m), dur, g, a: 0.02, lp: f1, q: 6, vib: [5.5, 3], hold: true, rel: 0.06, rev: 0.35, pan });
        A.osc(t, { type: 'sawtooth', f: midi(m), dur, g: g * 0.5, a: 0.02, lp: f2, q: 9, vib: [5.5, 3], hold: true, rel: 0.06, pan });
      };
      const block = (t, f, g = 0.12) => { A.osc(t, { type: 'triangle', f, f2: f * 0.8, glide: 0.05, dur: 0.07, g }); A.noise(t, { type: 'bandpass', f: f * 3, q: 4, dur: 0.03, g: g * 0.4 }); };
      const ring = (t, g = 0.06) => { A.bell(t, 2350, { g, dur: 0.7, ratios: [1, 1.48, 2.1], rev: 0.3 }); A.bell(t + 0.09, 2350, { g: g * 0.8, dur: 0.6, ratios: [1, 1.48, 2.1] }); };
      // Rhythmus: a dry metronome and cluster stabs on every move
      for (let k = 0; k < 6; k++) block(0.05 + k * 0.25, k % 2 ? 1400 : 1900, 0.06);
      [[0.05, [48, 49, 55]], [0.4, [60, 61, 66]], [0.72, [53, 59, 64]], [1.05, [47, 53, 58, 63]]].forEach(([t, ch], i) => ch.forEach(m => pno(t, m, 0.07, 1.2, { pan: i % 2 ? 0.3 : -0.3 })));
      A.noise(0.98, { type: 'highpass', f: 2000, dur: 0.25, g: 0.06 });
      // iris: the disc starts to turn — a whirring motor and a music-box loop
      A.osc(DA_T.iris, { type: 'triangle', f: 70, dur: 2.1, g: 0.05, vib: [3.6, 6], hold: true, rel: 0.3, lp: 500 });
      A.whoosh(DA_T.iris - 0.1, 0.5, { f1: 300, f2: 2500, g: 0.08 });
      const box = [84, 88, 91, 95, 91, 88, 86, 89];
      for (let k = 0; k < 12; k++) A.bell(DA_T.iris + 0.2 + k * 0.155, midi(box[k % 8] - (k > 7 ? 1 : 0)), { g: 0.035, dur: 0.5, ratios: [1, 3.0, 5.1], rev: 0.3, pan: Math.sin(k) * 0.5 });
      // the spiral text: Ball's chant begins
      [[DA_T.text, 50, 0.3, 700, 1100], [DA_T.text + 0.3, 50, 0.3, 300, 2300], [DA_T.text + 0.6, 53, 0.25, 600, 1000], [DA_T.text + 0.85, 50, 0.4, 400, 800]].forEach(([t, m, d, f1, f2]) => voice(t, m, d, f1, f2, 0.07));
      // the sheet tears up from below
      for (let k = 0; k < 9; k++) A.noise(DA_T.paper + k * 0.045, { type: 'bandpass', f: 1800 + hash(k * 3) * 1800, q: 2, dur: 0.05, g: 0.08, crush: true });
      // Arp's squares land: pitched by chance
      DA_SQ.forEach((S, i) => { block(S.at + 0.42, 160 + hash(i * 9) * 220, 0.16); });
      A.whoosh(DA_T.head, 0.45, { f1: 400, f2: 1500, g: 0.08 });
      A.osc(DA_T.head + 0.45, { type: 'square', f: 98, f2: 92, dur: 0.3, g: 0.04, lp: 900 });
      // the poem: every word a syllable, a drum and a noise
      const syl = [[700, 1100], [300, 2300], [600, 1000], [400, 800], [350, 2000], [700, 1200], [300, 900], [650, 1080], [400, 800]];
      DA_WAT.forEach((t, i) => {
        voice(t, [50, 53, 50, 55, 50, 57, 50, 53, 45][i], 0.12, syl[i][0], syl[i][1], 0.08, (i % 3 - 1) * 0.4);
        A.kick(t, 0.32, { f: 120, f2: 48 });
        if (i % 3 === 1) A.snare(t, 0.1, { f: 1600, rev: 0.2 });
      });
      ring(DA_WAT[2] + 0.05, 0.05); ring(DA_WAT[8] + 0.05, 0.06);
      A.osc(DA_WAT[5], { f: 1400, f2: 2600, glide: 0.18, dur: 0.22, g: 0.04, vib: [22, 40] });
      // typewriter: one strike per letter, the bell at the end of the line
      for (let k = 0; k < 36; k++) { const t = DA_T.type + k * (0.75 / 36); A.noise(t, { type: 'bandpass', f: 2600 + hash(k) * 900, q: 3, dur: 0.02, g: 0.05 }); }
      A.bell(DA_T.type + 0.78, 2100, { g: 0.04, dur: 0.6, ratios: [1, 2.7] });
      // chance: eight re-rolls a second, each a different instrument
      for (let k = 0; k < 7; k++) {
        const t = DA_T.chaos + k * 0.125, q = hash(k * 31);
        if (q < 0.25) A.kick(t, 0.35, { f: 110, f2: 40 });
        else if (q < 0.5) block(t, 300 + hash(k) * 900, 0.12);
        else if (q < 0.75) pno(t, 40 + ((hash(k * 7) * 30) | 0), 0.08, 0.6);
        else A.snare(t, 0.12, { f: 2200 });
        A.hat(t + 0.06, 0.025, false, { pan: k % 2 ? 0.4 : -0.4 });
      }
      A.osc(DA_T.chaos, { type: 'sawtooth', f: 220, f2: 880, glide: 0.85, dur: 0.85, g: 0.03, lp: 2000, vib: [7, 15] });
      voice(DA_T.chaos + 0.5, 62, 0.3, 700, 1100, 0.06); voice(DA_T.chaos + 0.62, 65, 0.25, 300, 2300, 0.06);
      // the blow-out and the title set letter by letter
      A.whoosh(DA_T.blow, 0.4, { f1: 200, f2: 3500, g: 0.16 });
      A.impact(DA_T.title, 0.5, { rev: 0.4 });
      const inst = [t => A.kick(t, 0.5, { f: 100, f2: 40 }), t => { A.osc(t, { type: 'sawtooth', f: 233, dur: 0.2, g: 0.05, lp: 1200, vib: [6, 8] }); A.osc(t, { type: 'square', f: 311, dur: 0.2, g: 0.03, lp: 1400 }); }, t => block(t, 620, 0.2), t => ring(t, 0.06)];
      DA_TITLE.forEach((_, i) => { const t = DA_T.title + i * 0.17; inst[i](t); pno(t, [43, 49, 44, 50][i], 0.08, 0.8); });
      // -ISM: a slide whistle up, the final cabaret chord (unresolved on purpose)
      A.osc(DA_T.ism - 0.15, { f: 600, f2: 1800, glide: 0.18, dur: 0.22, g: 0.04 });
      [36, 42, 48, 55, 61, 64, 70].forEach((m, j) => pno(DA_T.ism + j * 0.012, m, j < 2 ? 0.1 : 0.06, 2.6, { rev: 0.5 }));
      A.kick(DA_T.ism, 0.4, { f: 90, f2: 38 }); A.noise(DA_T.ism, { type: 'highpass', f: 5000, dur: 1.4, g: 0.05, rev: 0.5 });
      for (let k = 0; k < 14; k++) A.noise(DA_T.cap + k * 0.036, { type: 'bandpass', f: 2600 + hash(k + 50) * 900, q: 3, dur: 0.02, g: 0.035 });
      voice(9.0, 50, 0.6, 400, 800, 0.05);
      ring(9.25, 0.04);
    },
  });
  /* =====================================================================
     MID-CENTURY MODERN — an atomic starburst pops on a cream ground and
     boomerangs whirl off it as a flat-colour backdrop assembles itself
     like a stage set; the camera pans Hanna-Barbera style past lollipop
     trees, a geometric cardinal and a butterfly-roof house, colour fills
     printed a few pixels off their brown ink lines; it tilts up into a sky
     of sparkles, Girard-like tiles flip on the beat, and they fall away to
     a kidney-shaped title card where the bird comes to rest
     ===================================================================== */
  const MC = { cream: '#f1e4c8', paper: '#ead9b6', mustard: '#e0a227', teal: '#2c8580', turq: '#6bbcb0', orange: '#d75f2a', olive: '#98a03b', brown: '#4a2e21', pink: '#e8a196', red: '#c6402c', line: '#3b2519', sky: '#cfe3d4' };
  const MC_S = 'Yellowtail, cursive', MC_J = '"Josefin Sans", Futura, sans-serif';
  const MC_T = { set: 0.25, pan0: 0.8, pan1: 5.6, tilt: 5.35, tiles: 5.95, flip: [6.4, 6.85], clear: 7.3, card: 7.55, word: 7.85, cap: 8.35, land: 8.55 };
  const MC_GY = 820; // ground line
  const MC_B = 0.4545; // 132 bpm
  // Backdrop props in world x (parallax 1.0).
  const MC_P = [
    { k: 'tri', x: 260, h: 430, w: 150, col: MC.teal }, { k: 'lol', x: 520, h: 330, r: 115, col: MC.olive }, { k: 'lol', x: 760, h: 200, r: 70, col: MC.orange },
    { k: 'lol', x: 1130, h: 400, r: 165, col: MC.teal, branch: true }, { k: 'tri', x: 1530, h: 360, w: 130, col: MC.mustard }, { k: 'pool', x: 1840 },
    { k: 'house', x: 2300 }, { k: 'tri', x: 3180, h: 470, w: 160, col: MC.olive }, { k: 'lol', x: 3420, h: 280, r: 105, col: MC.pink }, { k: 'lol', x: 3640, h: 360, r: 130, col: MC.orange },
  ];
  const MC_BR = [1300, 560]; // branch tip where the cardinal sits

  // Fill a path, then print its ink line slightly off-register (the UPA / Hanna-Barbera look).
  function mcInk(c, path, fill, o = {}) {
    if (fill) { c.fillStyle = fill; path(); c.fill(); }
    if (o.line === false) return;
    c.save(); c.translate(o.dx ?? 7, o.dy ?? -5);
    c.strokeStyle = o.ink || MC.line; c.lineWidth = o.lw || 3.2; c.lineJoin = 'round'; c.lineCap = 'round';
    path(); c.stroke(); c.restore();
  }
  function mcStar(c, x, y, R, n, a, col, inner = 0.1) {
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath();
    for (let k = 0; k < n * 2; k++) { const th = (k / (n * 2)) * TAU, r = k % 2 ? R * inner : (k % 4 === 0 ? R : R * 0.62); c.lineTo(Math.cos(th) * r, Math.sin(th) * r); }
    c.closePath(); c.fill(); c.restore();
  }
  function mcBoom(c, x, y, s, a, col) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    const p = () => {
      c.beginPath(); c.moveTo(-110, 14);
      c.quadraticCurveTo(-56, -72, 0, -38); c.quadraticCurveTo(56, -72, 110, 14);
      c.quadraticCurveTo(122, 44, 94, 40); c.quadraticCurveTo(44, -8, 0, 12);
      c.quadraticCurveTo(-44, -8, -94, 40); c.quadraticCurveTo(-122, 44, -110, 14); c.closePath();
    };
    mcInk(c, p, col, { lw: 3 / s, dx: 6 / s, dy: -4 / s });
    c.restore();
  }
  function mcKidney(c, x, y, w, h, a = 0) {
    c.beginPath();
    for (let k = 0; k <= 72; k++) {
      const th = (k / 72) * TAU, dent = 0.3 * Math.exp(-Math.pow(Math.atan2(Math.sin(th + PI / 2), Math.cos(th + PI / 2)), 2) / 0.9);
      const r = 1 - dent + 0.06 * Math.cos(2 * th), px = Math.cos(th) * r * w / 2, py = Math.sin(th) * r * h / 2 * (1 - 0.06 * Math.cos(th));
      const ca = Math.cos(a), sa = Math.sin(a);
      c.lineTo(x + px * ca - py * sa, y + px * sa + py * ca);
    }
    c.closePath();
  }
  // Charley Harper-style cardinal: circles and triangles, no feathers.
  function mcBird(c, x, y, s, o = {}) {
    const flap = o.flap ?? 0, look = o.look ?? 0;
    c.save(); c.translate(x, y); c.scale(s * (o.dir || 1), s);
    // tail
    c.fillStyle = '#9e2a1d'; c.beginPath(); c.moveTo(-40, 10); c.lineTo(-150, 70 - (o.tail || 0) * 30); c.lineTo(-128, 92 - (o.tail || 0) * 30); c.closePath(); c.fill();
    // body: a teardrop
    c.fillStyle = MC.red; c.beginPath(); c.moveTo(-60, 20); c.quadraticCurveTo(-30, -70, 40, -40); c.arc(30, 0, 44, -PI / 2, PI / 2); c.quadraticCurveTo(-20, 60, -60, 20); c.fill();
    // crest
    c.beginPath(); c.moveTo(14, -40); c.lineTo(4 + look * 4, -96); c.lineTo(52, -38); c.closePath(); c.fill();
    // wing: a half-moon that flaps
    c.save(); c.translate(-6, 0); c.rotate(-0.2 - flap * 1.1); c.fillStyle = '#a8301f';
    c.beginPath(); c.ellipse(-20, 0, 58, 26, 0, 0, PI); c.fill(); c.restore();
    // mask, beak, eye
    c.fillStyle = MC.brown; c.beginPath(); c.moveTo(36, -30); c.lineTo(82, -10); c.lineTo(46, 4); c.closePath(); c.fill();
    c.fillStyle = MC.mustard; c.beginPath(); c.moveTo(66, -22); c.lineTo(102, -8); c.lineTo(66, 4); c.closePath(); c.fill();
    c.fillStyle = MC.cream; c.beginPath(); c.arc(52, -16, 6, 0, TAU); c.fill();
    // legs
    if (!o.fly) { c.strokeStyle = MC.brown; c.lineWidth = 4; c.beginPath(); c.moveTo(8, 42); c.lineTo(4, 62); c.moveTo(26, 42); c.lineTo(24, 62); c.stroke(); }
    c.restore();
  }
  function mcProp(c, P, t) {
    const gy = MC_GY;
    if (P.k === 'lol') {
      c.strokeStyle = MC.brown; c.lineWidth = 7; c.beginPath(); c.moveTo(P.x, gy); c.lineTo(P.x, gy - P.h + P.r * 0.3); c.stroke();
      if (P.branch) { c.lineWidth = 6; c.beginPath(); c.moveTo(P.x, gy - P.h * 0.55); c.lineTo(MC_BR[0], MC_BR[1]); c.stroke(); c.fillStyle = MC.olive; c.beginPath(); c.ellipse(MC_BR[0] - 40, MC_BR[1] + 6, 36, 13, -0.3, 0, TAU); c.fill(); }
      const cy = gy - P.h, sw = Math.sin(t * 1.6 + P.x) * 3;
      mcInk(c, () => { c.beginPath(); c.ellipse(P.x + sw, cy, P.r, P.r * 1.08, 0, 0, TAU); }, P.col);
      // Harper-ish leaf ticks
      c.strokeStyle = 'rgba(241,228,200,0.55)'; c.lineWidth = 3;
      for (let k = 0; k < 5; k++) { const a = k * 1.3 + P.x, rr = P.r * 0.5; const px = P.x + sw + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; c.beginPath(); c.moveTo(px - 10, py + 6); c.lineTo(px, py - 4); c.lineTo(px + 10, py + 6); c.stroke(); }
    } else if (P.k === 'tri') {
      c.fillStyle = MC.brown; c.fillRect(P.x - 5, gy - 60, 10, 60);
      const tri = () => { c.beginPath(); c.moveTo(P.x, gy - P.h); c.lineTo(P.x + P.w / 2, gy - 50); c.lineTo(P.x - P.w / 2, gy - 50); c.closePath(); };
      mcInk(c, tri, P.col);
      c.save(); tri(); c.clip(); c.fillStyle = 'rgba(40,25,15,0.18)';
      for (let y = gy - P.h + 40; y < gy - 50; y += 46) c.fillRect(P.x - P.w, y, P.w * 2, 16);
      c.restore();
    } else if (P.k === 'pool') {
      mcInk(c, () => mcKidney(c, P.x, gy + 110, 380, 120, 0.05), MC.turq, { dy: -4 });
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4;
      for (let k = 0; k < 3; k++) { const ox = Math.sin(t * 2 + k) * 14; c.beginPath(); c.moveTo(P.x - 100 + k * 70 + ox, gy + 100 + k * 12); c.lineTo(P.x - 60 + k * 70 + ox, gy + 100 + k * 12); c.stroke(); }
      // a boomerang coffee table on hairpin legs
      c.strokeStyle = MC.brown; c.lineWidth = 3; c.beginPath();
      [[-60, 0], [-10, 8], [40, 0]].forEach(([dx, dy]) => { c.moveTo(P.x + 260 + dx, gy + 60 + dy); c.lineTo(P.x + 254 + dx, gy + 110 + dy); });
      c.stroke();
      mcBoom(c, P.x + 250, gy + 60, 0.62, 0.1, MC.mustard);
    } else if (P.k === 'house') {
      const x0 = P.x, w = 720, top = gy - 330;
      // stilts and terrace
      c.strokeStyle = MC.brown; c.lineWidth = 6; c.beginPath();
      for (let k = 0; k < 5; k++) { c.moveTo(x0 + 30 + k * 165, gy); c.lineTo(x0 + 30 + k * 165, gy - 70); } c.stroke();
      c.fillStyle = MC.brown; c.fillRect(x0 - 20, gy - 80, w + 40, 14);
      // wall panels
      const pans = [MC.orange, MC.cream, MC.teal, MC.cream, MC.mustard];
      pans.forEach((col, k) => { c.fillStyle = col; c.fillRect(x0 + k * w / 5, top + 30, w / 5, gy - 80 - top - 30); });
      // big window with thin mullions
      c.fillStyle = MC.sky; c.fillRect(x0 + w * 0.2 + 12, top + 70, w * 0.4 - 24, 170);
      c.strokeStyle = MC.line; c.lineWidth = 3;
      for (let k = 0; k <= 4; k++) { const xx = x0 + w * 0.2 + 12 + k * (w * 0.4 - 24) / 4; c.beginPath(); c.moveTo(xx, top + 70); c.lineTo(xx, top + 240); c.stroke(); }
      c.strokeRect(x0 + w * 0.2 + 12, top + 70, w * 0.4 - 24, 170);
      // a lamp silhouette in the window
      c.fillStyle = MC.mustard; c.beginPath(); c.moveTo(x0 + 330, top + 150); c.lineTo(x0 + 370, top + 150); c.lineTo(x0 + 384, top + 186); c.lineTo(x0 + 316, top + 186); c.closePath(); c.fill();
      c.strokeStyle = MC.brown; c.beginPath(); c.moveTo(x0 + 350, top + 186); c.lineTo(x0 + 350, top + 240); c.stroke();
      // starburst wall clock
      mcStar(c, x0 + w * 0.9, top + 130, 58, 12, t * 0.4, MC.brown, 0.18);
      c.fillStyle = MC.mustard; c.beginPath(); c.arc(x0 + w * 0.9, top + 130, 14, 0, TAU); c.fill();
      // butterfly roof
      mcInk(c, () => { c.beginPath(); c.moveTo(x0 - 60, top - 40); c.lineTo(x0 + w * 0.55, top + 30); c.lineTo(x0 + w + 60, top - 60); c.lineTo(x0 + w + 60, top - 38); c.lineTo(x0 + w * 0.55, top + 50); c.lineTo(x0 - 60, top - 18); c.closePath(); }, MC.brown, { ink: MC.orange, dx: 8, dy: -8 });
      // TV antenna
      c.strokeStyle = MC.line; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + w - 40, top - 48); c.lineTo(x0 + w - 40, top - 170);
      [[-50, -150], [50, -150], [-36, -128], [36, -128]].forEach(([dx, dy]) => { c.moveTo(x0 + w - 40, top + dy); c.lineTo(x0 + w - 40 + dx, top + dy - 10); }); c.stroke();
    }
  }
  // Girard-ish tile motifs.
  const MC_TC = [MC.orange, MC.teal, MC.mustard, MC.pink, MC.olive, MC.cream, MC.brown, MC.turq];
  function mcTile(c, x, y, s, m, bg, fg, t) {
    c.fillStyle = bg; c.fillRect(x - s / 2, y - s / 2, s, s);
    c.fillStyle = fg; c.strokeStyle = fg;
    const r = s * 0.36;
    if (m === 0) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = bg; c.beginPath(); c.arc(x, y, r * 0.42, 0, TAU); c.fill(); }
    else if (m === 1) { c.beginPath(); c.arc(x, y + s / 2, r * 1.3, PI, TAU); c.fill(); }
    else if (m === 2) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fill(); }
    else if (m === 3) mcStar(c, x, y, r * 1.15, 8, t * 0.5, fg, 0.16);
    else if (m === 4) { for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.42, r * 0.2, a, 0, TAU); c.fill(); } }
    else { c.beginPath(); c.ellipse(x, y, r, r * 0.55, 0, 0, TAU); c.fill(); c.fillStyle = bg; c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill(); }
  }

  MG.film({
    id: 'midcentury', dur: 10, poster: 9.4,
    fonts: [['400 220px Yellowtail', 'Mid-century'], ['700 120px "Josefin Sans"', 'MODERN'], ['400 30px "Josefin Sans"', 'ATOMICGEDSN1945—69HRPLYBUM·']],
    meta: {
      family: 'A', name: 'Mid-century Modern', sub: 'Atomic-Age Flat Colour', era: '1945 — 1969',
      origin: 'The post-war look of the American 1950s and early ’60s: UPA’s limited animation (Gerald McBoing-Boing, 1950) and the TV backgrounds of Hanna-Barbera artists such as Ed Benedict and Art Lozzi, Mary Blair’s colour styling for Disney, Charley Harper’s geometric birds, Alexander Girard’s textiles for Herman Miller, and the furniture of Charles and Ray Eames. Atomic-age optimism turned into boomerangs, starbursts, kidney shapes and flat, textured colour printed slightly off its ink line.',
      works: 'Gerald McBoing-Boing (UPA, 1950) · The Flintstones / The Jetsons backgrounds (Hanna-Barbera, 1960–63) · It’s a Small World (Mary Blair, 1964) · Charley Harper’s Ford Times bird prints (1950s) · Girard textiles for Herman Miller (1952—) · Eames Lounge Chair (1956) · Sleeping Beauty backgrounds (Eyvind Earle, 1959)',
      tech: ['Parallax backdrop pan', 'Off-register ink lines over flat fills', 'Geometric character on twos', 'Wave-flipped pattern tiles'],
      accent: '#e0a227',
      motionDNA: 'Bouncy and optimistic: shapes pop on with a little overshoot, boomerangs whirl, the backdrop slides past in a smooth TV-cartoon pan while the characters move on twos, and sparkles twinkle on the off-beats of a cool-jazz combo.',
      visualDNA: 'Mustard, teal, burnt orange, olive and pink on cream; flat fills with a dry-brush texture, brown ink lines printed a few pixels off the colour, lollipop and triangle trees, butterfly roofs, kidney shapes, boomerangs and four-point starbursts.',
      transitions: 'Starburst pop and boomerang wipe, stage-set assembly, parallax pan, tilt-up to sky, tile wave flip, tile drop to title card',
      implementation: ['Gouache backgrounds and cel overlay', 'Illustrator + After Effects', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1956);
      // dry-brush paper tooth over the whole frame (static, so it costs nothing per frame)
      const tex = offscreen(W, H), g = tex.getContext('2d');
      for (let k = 0; k < 9000; k++) {
        const x = r() * W, y = r() * H, l = 6 + r() * 40;
        g.strokeStyle = r() < 0.5 ? `rgba(70,45,20,${0.02 + r() * 0.035})` : `rgba(255,250,235,${0.03 + r() * 0.05})`;
        g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 3); g.stroke();
      }
      for (let k = 0; k < 5000; k++) { g.fillStyle = `rgba(60,40,20,${0.04 + r() * 0.06})`; g.fillRect(r() * W, r() * H, 1.5, 1.5); }
      const sparks = Array.from({ length: 40 }, (_, i) => ({ x: r() * 1920, y: 60 + r() * 1700, R: 14 + r() * 40, ph: r() * TAU, col: [MC.mustard, MC.orange, MC.teal, MC.brown, MC.pink][i % 5], n: r() < 0.6 ? 4 : 8 }));
      const tiles = [];
      for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) tiles.push({ i, j, m: (i * 3 + j * 5 + ((r() * 2) | 0)) % 6, m2: ((r() * 6) | 0), bg: MC_TC[(i + j * 3) % 8], fg: MC_TC[(i * 5 + j * 2 + 3) % 8] });
      tiles.forEach(T => { if (T.fg === T.bg) T.fg = MC.cream === T.bg ? MC.brown : MC.cream; });
      return { tex, sparks, tiles };
    },
    draw(c, t, W, H, st) {
      c.fillStyle = MC.cream; c.fillRect(0, 0, W, H);
      const cx = kf(t, [[MC_T.pan0, 0], [MC_T.pan1, 2000, E.ioS]]);
      const tilt = E.ioC(seg(t, MC_T.tilt, MC_T.tilt + 0.75)) * 1150;
      const scene = t < MC_T.tiles + 0.8;
      const rise = k => E.outB(seg(t, MC_T.set + k * 0.13, MC_T.set + 0.45 + k * 0.13), 1.4);
      if (scene) {
        c.save(); c.translate(0, tilt);
        // sky stripe and the big sun
        const su = rise(0);
        c.fillStyle = MC.sky; c.fillRect(0, 380 - tilt, W * Math.min(1, su), MC_GY - 380 + tilt);
        mcInk(c, () => { c.beginPath(); c.arc(1380 - cx * 0.08, 330, 190 * su, 0, TAU); }, MC.mustard, { ink: MC.orange, dx: 12, dy: 10, lw: 4 });
        // far hills (0.3) and mid hills (0.6), rising into place like flats on a stage
        const fh = (1 - rise(1)) * 600;
        c.fillStyle = MC.turq;
        for (let k = 0; k < 6; k++) { const x = k * 900 - cx * 0.3; c.beginPath(); c.ellipse(x, MC_GY + fh, 620, 250, 0, PI, TAU); c.fill(); }
        const mh = (1 - rise(2)) * 700;
        for (let k = 0; k < 7; k++) { const x = k * 760 + 300 - cx * 0.6; mcInk(c, () => { c.beginPath(); c.ellipse(x, MC_GY + 20 + mh, 420, 170, 0, PI, TAU); }, k % 2 ? MC.olive : MC.teal, { dx: 8, dy: -6 }); }
        // ground
        const gh = (1 - rise(3)) * 500;
        c.fillStyle = MC.mustard; c.fillRect(0, MC_GY + gh, W, H - MC_GY + 400);
        c.fillStyle = 'rgba(200,120,30,0.5)'; for (let k = 0; k < 14; k++) { const x = ((k * 330 - cx * 1.0) % 4620 + 4620) % 4620 - 300; c.fillRect(x, MC_GY + 70 + gh + (k % 3) * 60, 120 + (k % 4) * 40, 10); }
        // props
        c.save(); c.translate(-cx, 0);
        MC_P.forEach((P, i) => {
          const sx = P.x - cx; if (sx < -500 || sx > W + 900) return;
          const ru = rise(3 + (i % 4) * 0.5);
          c.save(); c.translate(P.x, MC_GY); c.scale(1, ru); c.translate(-P.x, -MC_GY);
          mcProp(c, P, t);
          c.restore();
        });
        // the cardinal: hops on twos, looks round, flies off
        const tb = Math.floor(t * 12) / 12;
        if (tb < 4.9) {
          let bx = MC_BR[0] - 150, by = MC_BR[1] - 58, flap = 0, fly = false;
          [1.9, 2.45].forEach(k => { const u = seg(tb, k, k + 0.25); bx += u * 52; by -= Math.sin(u * PI) * 40; });
          const look = tb > 2.9 && tb < 3.4 ? 1 : 0;
          const fu = seg(tb, 3.6, 4.9);
          if (fu > 0) { fly = true; bx += fu * 1500; by -= E.inQ(fu) * 520 + Math.sin(fu * 14) * 20; flap = Math.floor(tb * 12) % 2; }
          const pop = E.outB(seg(t, 1.0, 1.3), 2.5);
          if (pop > 0) mcBird(c, bx, by, 0.85 * pop, { flap, fly, look, tail: Math.floor(tb * 6) % 3 === 0 ? 1 : 0 });
        }
        c.restore();
        // foreground spiky grass (1.5)
        c.fillStyle = MC.brown;
        for (let k = 0; k < 10; k++) {
          const x = ((k * 520 + 200 - cx * 1.5) % 5200 + 5200) % 5200 - 300, y = H + 10 + (1 - rise(4)) * 300;
          c.beginPath(); c.moveTo(x - 60, y); for (let s = 0; s < 7; s++) { c.lineTo(x - 50 + s * 16, y - 70 - (s % 2) * 50 - Math.abs(3 - s) * -8); c.lineTo(x - 42 + s * 16, y); } c.closePath(); c.fill();
        }
        c.restore();
        // sky above the scene, revealed by the tilt
        st.sparks.forEach((S, i) => {
          const y = S.y - 1150 + tilt; if (y < -80 || y > H + 80) return;
          const tw = 0.75 + 0.25 * Math.sin(t * 5 + S.ph) + (Math.floor(t / MC_B * 2) % 2 === i % 2 ? 0.12 : 0);
          mcStar(c, ((S.x - cx * 0.15) % 2000 + 2000) % 2000 - 40, y, S.R * tw * 1.3, S.n, S.ph + t * 0.3, S.col, 0.1);
        });
        // an atom: three ellipse orbits and a nucleus
        if (tilt > 200) {
          const ax = 960, ay = 520 - 1150 + tilt + 160, as = E.outB(seg(t, MC_T.tilt + 0.4, MC_T.tilt + 0.75), 2);
          c.save(); c.translate(ax, ay); c.scale(as, as); c.strokeStyle = MC.brown; c.lineWidth = 6;
          for (let k = 0; k < 3; k++) { c.save(); c.rotate(k * PI / 3 + t * 0.4); c.beginPath(); c.ellipse(0, 0, 230, 70, 0, 0, TAU); c.stroke();
            const e = t * 4 + k * 2; c.fillStyle = [MC.orange, MC.teal, MC.mustard][k]; c.beginPath(); c.arc(Math.cos(e) * 230, Math.sin(e) * 70, 18, 0, TAU); c.fill(); c.restore(); }
          c.fillStyle = MC.red; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill();
          c.restore();
        }
      }
      // ---------- opening: starburst pop and boomerang whirl ----------
      if (t < 1.4) {
        const p = E.outB(seg(t, 0.0, 0.3), 2.5) * (1 - E.inQ(seg(t, 0.9, 1.25)));
        if (p > 0) mcStar(c, 960, 520, 300 * p, 4, t * 1.2, MC.orange, 0.09);
        if (p > 0) mcStar(c, 960, 520, 190 * p, 4, t * 1.2 + PI / 4, MC.teal, 0.12);
        [MC.mustard, MC.teal, MC.pink, MC.olive].forEach((col, i) => {
          const u = seg(t, 0.1 + i * 0.06, 1.15 + i * 0.06); if (u <= 0 || u >= 1) return;
          const a = i * PI / 2 + E.ioS(u) * 2.6, rr = 120 + E.inQ(u) * 1400;
          mcBoom(c, 960 + Math.cos(a) * rr, 520 + Math.sin(a) * rr * 0.7, 1.1, a * 3, col);
        });
      }
      // ---------- tiles ----------
      if (t >= MC_T.tiles) {
        const S = 160;
        st.tiles.forEach((T, n) => {
          const x = T.i * S + S / 2, y = T.j * S + S / 2 - 20, d = (T.i + T.j) * 0.03;
          const pu = E.outB(seg(t, MC_T.tiles + d, MC_T.tiles + d + 0.3), 2);
          const cd = Math.hypot(T.i - 5.5, T.j - 3) * 0.035, out = E.inB(seg(t, MC_T.clear + cd, MC_T.clear + cd + 0.32), 1.6);
          const s = pu * (1 - out); if (s <= 0.01) return;
          let sx = 1, flips = 0;
          MC_T.flip.forEach(f => { const u = seg(t, f + d * 0.8, f + d * 0.8 + 0.22); if (u > 0) { sx = Math.cos(u * PI); flips += u >= 0.5 ? 1 : 0; } });
          const m = flips % 2 ? T.m2 : T.m, bg = flips % 2 ? T.fg : T.bg, fg = flips % 2 ? T.bg : T.fg;
          c.save(); c.translate(x, y + out * 120); c.rotate(out * (n % 2 ? 0.6 : -0.6)); c.scale(s * Math.abs(sx) + 0.001, s);
          mcTile(c, 0, 0, S + 1, m, bg, fg, t);
          c.restore();
        });
      }
      // ---------- the title card ----------
      if (t >= MC_T.card) {
        const ku = E.outB(seg(t, MC_T.card, MC_T.card + 0.45), 1.8);
        // orbiting boomerangs and sparkles behind the card
        [MC.orange, MC.teal, MC.mustard, MC.pink].forEach((col, i) => {
          const u = E.outQt(seg(t, MC_T.card + 0.1 + i * 0.08, MC_T.card + 0.6 + i * 0.08)), a = i * TAU / 4 + 0.5 + t * 0.35;
          if (u > 0) mcBoom(c, 960 + Math.cos(a) * 760 * u, 520 + Math.sin(a) * 400 * u, 0.9, a + PI / 2, col);
        });
        [[300, 210, 46, MC.mustard], [1640, 860, 54, MC.orange], [1590, 190, 34, MC.teal], [360, 860, 30, MC.brown], [1760, 470, 26, MC.pink], [170, 520, 24, MC.teal]].forEach(([x, y, R, col], i) => {
          const u = E.outB(seg(t, MC_T.word + i * 0.08, MC_T.word + 0.3 + i * 0.08), 2.5); if (u <= 0) return;
          mcStar(c, x, y, R * u * (1 + 0.15 * Math.sin(t * 6 + i)), 4, t * 0.5 + i, col, 0.1);
        });
        c.save(); c.translate(960, 540); c.scale(ku, ku); c.translate(-960, -540);
        mcInk(c, () => mcKidney(c, 960, 570, 1440, 740, 0), MC.teal, { dx: 14, dy: -10, lw: 5 });
        c.restore();
        const wu = E.outQt(seg(t, MC_T.word, MC_T.word + 0.5));
        if (wu > 0) {
          c.save(); c.beginPath(); c.rect(0, 0, 340 + 1300 * wu, H); c.clip();
          text(c, 'Mid-century', 966, 562, { font: MC_S, size: 230, color: MC.brown, align: 'center' });
          text(c, 'Mid-century', 960, 556, { font: MC_S, size: 230, color: MC.cream, align: 'center' });
          c.restore();
        }
        const mu = E.outB(seg(t, MC_T.word + 0.35, MC_T.word + 0.7), 2);
        if (mu > 0) {
          c.save(); c.translate(960, 680); c.scale(mu, mu);
          c.fillStyle = MC.orange; rrect(c, -330, -76, 660, 100, 50); c.fill();
          text(c, 'MODERN', 12, 2, { font: MC_J, weight: 700, size: 92, color: MC.cream, align: 'center', ls: 36 });
          c.restore();
        }
        const cu = E.outQt(seg(t, MC_T.cap, MC_T.cap + 0.5));
        if (cu > 0) {
          c.save(); c.globalAlpha = cu;
          text(c, 'ATOMIC AGE DESIGN  ·  1945 — 1969', 960, 800 + (1 - cu) * 20, { font: MC_J, weight: 700, size: 30, color: MC.cream, align: 'center', ls: 8 });
          text(c, 'HARPER  ·  BLAIR  ·  GIRARD  ·  EAMES  ·  UPA', 960, 1000, { font: MC_J, weight: 400, size: 28, color: MC.brown, align: 'center', ls: 10 });
          text(c, 'THE MOTION STYLE ATLAS  ·  FAMILY A', 960, 110, { font: MC_J, weight: 700, size: 26, color: MC.brown, align: 'center', ls: 10 });
          c.restore();
        }
        // the cardinal flies in and lands on the card
        const lu = seg(t, MC_T.land - 0.6, MC_T.land);
        if (lu > 0) {
          const tb = Math.floor(t * 12) / 12, fl = lu < 1;
          const bx = lerp(2100, 1420, E.outQ(lu)), by = lerp(-100, 330, E.outQ(lu)) + (fl ? 0 : -Math.max(0, Math.sin((t - MC_T.land) * 9)) * 6 * Math.exp(-(t - MC_T.land) * 4));
          mcBird(c, bx, by, 0.7, { dir: -1, fly: fl, flap: fl ? Math.floor(tb * 12) % 2 : 0, look: t > 9.0 && t < 9.6 ? 1 : 0 });
        }
      }
      c.globalCompositeOperation = 'multiply'; c.drawImage(st.tex, 0, 0); c.globalCompositeOperation = 'source-over';
      grain(c, W, H, t, 0.035, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const B = MC_B;
      // vibraphone: sine partials 1 : 4 : 10 with a slow tremolo
      const vibe = (t, m, g = 0.07, dur = 1.6, pan = 0) => {
        A.osc(t, { f: midi(m), dur, g, a: 0.003, vib: [5.5, 1.2], rev: 0.35, pan });
        A.osc(t, { f: midi(m) * 4, dur: dur * 0.25, g: g * 0.25, a: 0.002, pan });
        A.osc(t, { f: midi(m) * 10, dur: dur * 0.08, g: g * 0.08, a: 0.001 });
      };
      const bass = (t, m, g = 0.3) => { A.pluck(t, midi(m), { dur: 0.6, g, bright: 0.25, decay: 0.993, lp: 900 }); A.osc(t, { f: midi(m), dur: 0.4, g: g * 0.4, a: 0.004 }); };
      const bongo = (t, f, g = 0.12, pan = 0) => A.osc(t, { f, f2: f * 0.8, glide: 0.06, dur: 0.12, g, a: 0.001, pan });
      const snap = (t, g = 0.08) => A.noise(t, { type: 'bandpass', f: 2400, q: 2, dur: 0.04, g, rev: 0.2 });
      const brush = (t, g = 0.03) => A.noise(t, { type: 'bandpass', f: 3500, q: 0.8, dur: 0.2, g, swell: 0.5 });
      // pop: a vibe gliss and a slide whistle under the boomerangs
      A.whoosh(0.05, 0.5, { f1: 600, f2: 3000, g: 0.08 });
      [72, 76, 79, 84, 88].forEach((m, i) => vibe(0.04 + i * 0.04, m, 0.05, 1.2, (i - 2) * 0.2));
      A.osc(0.2, { f: 500, f2: 1400, glide: 0.6, dur: 0.7, g: 0.035, vib: [6, 10] });
      [0.25, 0.38, 0.51, 0.64, 0.77].forEach((t, i) => bongo(t, 320 + i * 40, 0.1, i % 2 ? 0.3 : -0.3));
      // the combo: walking bass, brushes, snaps on 2 and 4 (ii–V–I–VI in F)
      const walk = [43, 45, 46, 47, 48, 50, 52, 48, 41, 43, 45, 46, 50, 49, 50, 52];
      const ch = [[55, 58, 62, 65], [55, 58, 60, 64], [57, 60, 64, 67], [54, 57, 60, 66]];
      for (let k = 0; k < 11; k++) {
        const t = MC_T.pan0 + k * B; if (t > MC_T.tilt + 0.1) break;
        bass(t, walk[k % 16]); brush(t, 0.025);
        if (k % 2) snap(t, 0.07);
        A.hat(t + B * 0.66, 0.018, false, { f: 9000, pan: 0.4 });
        if (k % 2 === 0) ch[(k / 2) % 4].forEach((m, j) => vibe(t + B * 0.66 + j * 0.01, m, 0.03, 0.9, (j - 1.5) * 0.25));
      }
      // melody on vibes as the camera pans
      [[1.25, 77], [1.7, 79], [2.15, 81], [2.6, 84], [3.0, 81], [3.5, 79], [3.95, 77], [4.4, 74], [4.85, 76], [5.15, 77]].forEach(([t, m]) => vibe(t, m, 0.06, 1.0));
      // the cardinal: two hops, a chirp, a flutter
      [1.9, 2.45].forEach(t => { bongo(t, 600, 0.06); A.osc(t + 0.1, { f: 2400, f2: 3400, glide: 0.08, dur: 0.1, g: 0.025 }); });
      [3.0, 3.15].forEach(t => A.osc(t, { f: 3000, f2: 4200, glide: 0.06, dur: 0.08, g: 0.03 }));
      for (let k = 0; k < 8; k++) A.noise(3.6 + k * 0.083, { type: 'bandpass', f: 1600, q: 1.5, dur: 0.05, g: 0.035, pan: 0.4 });
      // tilt up: harp-like vibe run and a soft riser
      [65, 69, 72, 76, 79, 81, 84, 88, 91].forEach((m, i) => vibe(MC_T.tilt + i * 0.07, m, 0.04, 1.1, (i / 8 - 0.5) * 0.8));
      A.riser(MC_T.tilt, 0.6, { g: 0.05, f: 220 });
      // tiles: a brassy shout chorus with bongo fills
      const brass = (t, notes, g = 0.03, dur = 0.3) => notes.forEach((m, j) => A.osc(t, { type: 'sawtooth', f: midi(m), dur, g, a: 0.02, lp: 2400, hold: true, rel: 0.08, detune: (j % 2 ? 6 : -6), rev: 0.25 }));
      brass(MC_T.tiles, [53, 57, 60, 64, 69], 0.025, 0.35);
      A.kick(MC_T.tiles, 0.3, { f: 100, f2: 45 });
      for (let k = 0; k < 6; k++) { const t = MC_T.tiles + 0.3 + k * B * 0.5; bass(t, [41, 45, 48, 50, 48, 45][k], 0.25); bongo(t, k % 2 ? 300 : 410, 0.1, k % 2 ? -0.3 : 0.3); }
      MC_T.flip.forEach((t, i) => { brass(t, i ? [55, 59, 62, 65, 69] : [54, 57, 60, 64, 67], 0.03, 0.25); A.snare(t, 0.08, { f: 2200, rev: 0.3 }); A.whoosh(t, 0.3, { f1: 1500, f2: 5000, g: 0.04 }); });
      // tiles fall: descending vibe; card bounces in on a big Fmaj9
      [96, 93, 89, 86, 84, 81].forEach((m, i) => vibe(MC_T.clear + i * 0.05, m, 0.035, 0.8));
      A.kick(MC_T.card, 0.4, { f: 90, f2: 40 });
      bass(MC_T.card, 41, 0.35);
      brass(MC_T.card, [53, 57, 60, 64, 67], 0.022, 0.6);
      [65, 69, 72, 76, 79].forEach((m, j) => vibe(MC_T.card + 0.02 + j * 0.03, m, 0.05, 2.6, (j - 2) * 0.25));
      A.osc(MC_T.word, { f: 700, f2: 1600, glide: 0.4, dur: 0.45, g: 0.03, vib: [6, 12] });
      snap(MC_T.word + 0.35, 0.1);
      for (let k = 0; k < 6; k++) { const t = MC_T.word + k * 0.08; A.bell(t, midi(96 + [0, 4, 7, 12, 7, 4][k]), { g: 0.02, dur: 0.6, ratios: [1, 4] }); }
      // the bird lands: a chirp; the combo tags out
      A.osc(MC_T.land, { f: 2800, f2: 4000, glide: 0.07, dur: 0.1, g: 0.03 }); A.osc(MC_T.land + 0.14, { f: 3200, f2: 4400, glide: 0.06, dur: 0.08, g: 0.025 });
      [[8.75, 48], [9.0, 45], [9.2, 41]].forEach(([t, m]) => bass(t, m, 0.28));
      snap(9.0, 0.06); brush(9.2, 0.03);
      [77, 81, 84, 88].forEach((m, j) => vibe(9.2 + j * 0.05, m, 0.035, 1.6));
    },
  });

  /* =====================================================================
     GRUNGE TYPOGRAPHY — a black film gate weaves while words scratched
     into the emulsion stutter past, doubled and flickering, spelling
     Carson's "don't mistake legibility for communication"; a hard cut to a
     magazine spread where columns of type overrun a blurred photo and each
     other, a giant word bleeds off the page and the headline is set in
     five fonts at once; black slabs shove SIGNAL against NOISE, the page
     tears into displaced slices, the film slips its frame line and lands
     on a distressed, overprinted GRUNGE
     ===================================================================== */
  const GR = { blk: '#0b0a09', bone: '#e7e1d3', dirt: '#cbc3b1', grey: '#8d877c', dark: '#2a2724', rust: '#a8301f' };
  const GR_A = 'Anton, Impact, sans-serif', GR_C = '"Courier Prime", "Courier New", monospace', GR_B = '"Libre Bodoni", Didot, serif', GR_H = '"Rock Salt", cursive';
  const GR_T = { cut: 2.7, beat: 0.6, reflow: 4.5, slab: 6.0, swap: 6.6, tear: 7.0, slip: 7.4, title: 7.6, typo: 8.15, cap: 8.5 };
  const GR_WORDS = [
    { s: "don't", at: 0.15, x: 520, y: 470, size: 150, r: -0.06 },
    { s: 'mistake', at: 0.6, x: 1180, y: 640, size: 170, r: 0.05 },
    { s: 'legibility', at: 1.05, x: 900, y: 420, size: 170, r: -0.03 },
    { s: 'for', at: 1.6, x: 640, y: 720, size: 160, r: 0.08 },
    { s: 'communication', at: 1.95, x: 960, y: 560, size: 150, r: -0.02 },
  ];
  const GR_BODY = 'there is no such thing as a neutral page. type is not a window, it is a voice, and voices crack. we photocopied the photocopy until the letters bled into each other, set the interview in a face nobody could read and printed it anyway. the reader leans in. the column runs off the edge of the page and keeps going somewhere else, under the photograph, over the folio, into the gutter where the staples are. nothing is aligned to anything except the feeling. ';
  // Headline letters: [char, font, size, dx, dy, rot, colour]
  const GR_HEAD = [['L', 'A', 260, 0, 0, 0, 'k'], ['e', 'B', 220, -14, 10, 0.05, 'k'], ['G', 'A', 300, -26, 30, -0.04, 'r'], ['i', 'C', 180, -10, -20, 0, 'k'], ['b', 'B', 240, -16, 18, PI, 'k'], ['I', 'A', 230, -10, -6, 0.02, 'k'], ['l', 'C', 200, -6, 26, 0, 'g'], ['i', 'B', 250, -18, 0, -0.1, 'k'], ['T', 'A', 280, -20, 14, 0, 'k'], ['y', 'B', 230, -12, -10, 0.08, 'r']];
  const GR_FONT = { A: [GR_A, 400, ''], B: [GR_B, 700, 'italic'], C: [GR_C, 700, ''] };
  const GR_COL = { k: GR.blk, r: GR.rust, g: GR.grey };

  // Word-wrap a string into a column image.
  function grColumn(s, w, font, size, lead, rows, col, r) {
    const cv = offscreen(w, rows * lead + 20), g = cv.getContext('2d');
    g.font = font; g.fillStyle = col; g.textBaseline = 'alphabetic';
    const words = s.split(' ');
    let line = '', y = size, k = 0;
    for (let n = 0; n < rows; n++) {
      line = '';
      while (g.measureText(line + words[k % words.length] + ' ').width < w) { line += words[k % words.length] + ' '; k++; }
      // justified, badly: stretch each line to the column
      const ws = line.trim().split(' '), tw = ws.reduce((a, q) => a + g.measureText(q).width, 0), gap = ws.length > 1 ? (w - tw) / (ws.length - 1) : 0;
      let x = 0; ws.forEach(q => { g.fillText(q, x, y); x += g.measureText(q).width + gap; });
      y += lead;
    }
    return cv;
  }
  // Erode a layer through the distress texture (specks, scratches, toner drop-out).
  function grErode(g, tex, w, h, ox = 0, oy = 0, a = 1) {
    g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = a;
    for (let y = -oy; y < h; y += tex.height) for (let x = -ox; x < w; x += tex.width) g.drawImage(tex, x, y);
    g.restore();
  }

  MG.film({
    id: 'grunge', dur: 10, poster: 9.4,
    fonts: [['400 300px Anton', 'GRUNGESIALNOLT'], ['400 100px "Rock Salt"', "don'tmisakelgbyfrcu"], ['700 40px "Courier Prime"', 'RAYGUNEMIFSO'], ['italic 700 150px "Libre Bodoni"', 'typographebl']],
    meta: {
      family: 'A', name: 'Grunge Typography', sub: 'Distressed, Layered, Illegible', era: '1990 — 1999',
      origin: 'The early-’90s reaction against Swiss order, made possible by the Macintosh: Emigre magazine (Rudy VanderLans and Zuzana Licko, from 1984) and its bitmap and distressed faces, Neville Brody’s experimental type magazine Fuse (from 1991), and above all David Carson’s art direction of Ray Gun (1992–95), which overlapped columns, cropped headlines off the page and once set an entire Bryan Ferry interview in Zapf Dingbats. Kyle Cooper’s hand-scratched, jittering title sequence for Se7en (1995) carried the look into motion and defined a decade of film and music-video titles.',
      works: 'Ray Gun (David Carson, 1992–95) · The End of Print (Carson and Lewis Blackwell, 1995) · Se7en title sequence (Kyle Cooper / R/GA, 1995) · Fuse (Neville Brody and Jon Wozencroft, 1991—) · Emigre magazine (VanderLans and Licko, 1984–2005) · Template Gothic (Barry Deck, 1990) · Beach Culture (Carson, 1989–91)',
      tech: ['Pre-eroded type through a distress texture', 'Gate weave and doubled exposures on twos', 'Overlapping justified columns', 'Self-sampled slice displacement'],
      accent: '#a8301f',
      motionDNA: 'Nervous and handmade: the frame weaves and stutters on twos, scratched words flicker in double exposure, layers slide over each other at different speeds, letters jitter into place and the page tears into horizontal slices before the film slips its frame line.',
      visualDNA: 'Dirty bone paper and black, one rust accent; heavy condensed sans against Bodoni italic and typewriter, letters overprinted and eroded, columns colliding with blurred photographs, giant cropped words, hairline rules, folios and dingbats.',
      transitions: 'Hard cut from scratched film to print, staggered layer slides, slab shove, slice tear, frame-line slip',
      implementation: ['QuarkXPress + photocopier', 'Scratched 35 mm film (Se7en)', 'After Effects with Twitch / Wiggle', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1995);
      // distress texture: toner drop-out specks, scratches and worn blotches
      const tex = offscreen(1024, 1024), d = tex.getContext('2d');
      d.fillStyle = '#000';
      for (let k = 0; k < 9000; k++) { const s = r() < 0.9 ? 1 + r() * 2.5 : 3 + r() * 7; d.globalAlpha = 0.4 + r() * 0.6; d.fillRect(r() * 1024, r() * 1024, s, s * (0.5 + r())); }
      d.globalAlpha = 1; d.strokeStyle = '#000';
      for (let k = 0; k < 110; k++) { const x = r() * 1024, y = r() * 1024, a = (r() - 0.5) * 0.4 + (r() < 0.3 ? PI / 2 : 0), l = 40 + r() * 400; d.lineWidth = 0.8 + r() * 2.2; d.beginPath(); d.moveTo(x, y); d.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); d.stroke(); }
      for (let k = 0; k < 26; k++) { const x = r() * 1024, y = r() * 1024, rr = 10 + r() * 50, g = d.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      // scratched-film words: marker hand, then shredded by horizontal scratches
      const words = GR_WORDS.map((Wd, i) => {
        const cv = offscreen(1500, 360), g = cv.getContext('2d');
        g.font = `400 ${Wd.size}px ${GR_H}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#f4f0e6'; g.fillText(Wd.s, 750, 180);
        g.strokeStyle = '#f4f0e6'; g.lineWidth = 1.5;
        for (let k = 0; k < 30; k++) { const x = 750 + (r() - 0.5) * g.measureText(Wd.s).width, y = 180 + (r() - 0.5) * Wd.size; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60); g.stroke(); }
        g.globalCompositeOperation = 'destination-out';
        for (let k = 0; k < 60; k++) { g.fillRect(0, r() * 360, 1500, 1 + r() * 2.5); }
        grErode(g, tex, 1500, 360, (i * 211) % 1024, (i * 97) % 1024, 0.8);
        return cv;
      });
      // body columns: typewriter, Bodoni italic, and a column set entirely in dingbats
      const colA = grColumn(GR_BODY, 300, `400 22px ${GR_C}`, 22, 25, 40, GR.blk);
      const colB = grColumn(GR_BODY.split('').reverse().join('').split(' ').reverse().join(' ') + GR_BODY, 270, `italic 700 27px ${GR_B}`, 27, 26, 34, GR.blk);
      const colD = offscreen(250, 980), dg = colD.getContext('2d');
      dg.fillStyle = GR.blk;
      for (let y = 20; y < 970; y += 28) for (let x = 6; x < 240; x += 24 + ((y * 7 + x) % 3) * 4) {
        const q = hash(x * 3.1 + y * 7.7);
        if (q < 0.25) dg.fillRect(x, y - 14, 14, 14); else if (q < 0.5) { dg.beginPath(); dg.arc(x + 7, y - 7, 7, 0, TAU); dg.fill(); }
        else if (q < 0.7) { dg.beginPath(); dg.moveTo(x, y); dg.lineTo(x + 8, y - 16); dg.lineTo(x + 16, y); dg.fill(); }
        else if (q < 0.85) { dg.font = `700 22px ${GR_C}`; dg.fillText('✚', x, y); } else { dg.fillRect(x, y - 8, 18, 4); }
      }
      [colA, colB, colD].forEach((cv, i) => grErode(cv.getContext('2d'), tex, cv.width, cv.height, i * 300, i * 170, 0.35));
      // blurred photograph: an out-of-focus figure, scanned too dark
      const photo = offscreen(640, 1080), p = photo.getContext('2d');
      p.fillStyle = GR.dark; p.fillRect(0, 0, 640, 1080);
      p.filter = 'blur(38px)';
      p.fillStyle = '#9a9286'; p.beginPath(); p.ellipse(330, 360, 150, 190, 0.1, 0, TAU); p.fill();
      p.fillStyle = '#6d665c'; p.beginPath(); p.ellipse(320, 860, 330, 260, 0, 0, TAU); p.fill();
      p.fillStyle = '#c9c0b0'; p.beginPath(); p.ellipse(380, 320, 50, 90, 0.2, 0, TAU); p.fill();
      p.fillStyle = '#16140f'; p.fillRect(0, 0, 90, 1080);
      p.filter = 'none';
      p.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < 1080; y += 4) p.fillRect(0, y, 640, 1.5);
      grErode(p, tex, 640, 1080, 400, 120, 0.25);
      // giant cropped background word
      const big = offscreen(2600, 1000), bg = big.getContext('2d');
      bg.font = `400 900px ${GR_A}`; bg.fillStyle = GR.dirt; bg.textBaseline = 'alphabetic'; bg.fillText('noise', 0, 900);
      grErode(bg, tex, 2600, 1000, 0, 0, 0.6);
      // paper: dirty bone with copier haze along the edges
      const paper = offscreen(1920, 1080), pg = paper.getContext('2d');
      pg.fillStyle = GR.bone; pg.fillRect(0, 0, 1920, 1080);
      for (let k = 0; k < 9000; k++) { pg.fillStyle = `rgba(40,35,25,${0.03 + r() * 0.07})`; pg.fillRect(r() * 1920, r() * 1080, 1 + r() * 2, 1 + r() * 2); }
      const pv = pg.createRadialGradient(960, 540, 300, 960, 540, 1150); pv.addColorStop(0, 'rgba(60,50,35,0)'); pv.addColorStop(1, 'rgba(60,50,35,0.3)');
      pg.fillStyle = pv; pg.fillRect(0, 0, 1920, 1080);
      // the title, overprinted and eroded once (moving pieces are drawn live)
      const title = offscreen(1920, 640), tg = title.getContext('2d');
      tg.font = `400 430px ${GR_A}`; tg.textBaseline = 'alphabetic'; tg.fillStyle = GR.blk;
      const tl = 'GRUNGE'.split(''), sx = [1.1, 0.86, 1.2, 0.92, 1.05, 1.24], dy = [0, 24, -10, 30, 6, -16];
      let x = 0; const lw = tl.map((ch, i) => tg.measureText(ch).width * sx[i]); const total = lw.reduce((a, b) => a + b, 0) - 5 * 22;
      x = (1920 - total) / 2;
      const letters = tl.map((ch, i) => { const L = { ch, x, sx: sx[i], dy: dy[i], w: lw[i] }; x += lw[i] - 22; return L; });
      letters.forEach(L => { tg.save(); tg.translate(L.x, 500 + L.dy); tg.scale(L.sx, 1); tg.fillText(L.ch, 0, 0); tg.restore(); });
      grErode(tg, tex, 1920, 640, 200, 300, 0.9);
      return { tex, words, colA, colB, colD, photo, big, paper, title, letters };
    },
    draw(c, t, W, H, st) {
      const fr = Math.floor(t * 12), tq = fr / 12;
      const weave = (amp, s = 0) => [(hash(fr * 1.7 + s) - 0.5) * amp, (hash(fr * 3.1 + s) - 0.5) * amp];

      // ---------- 1. scratched film ----------
      if (t < GR_T.cut) {
        const lum = 10 + hash(fr * 5.3) * 6;
        c.fillStyle = `rgb(${lum},${lum - 1},${lum - 2})`; c.fillRect(0, 0, W, H);
        const [gx, gy] = weave(14);
        c.save(); c.translate(gx, gy);
        // faint typewritten credits crawling behind, out of focus
        c.globalAlpha = 0.16;
        for (let k = 0; k < 9; k++) text(c, ['a film about type', 'printed on the wrong paper', 'set in the dark', 'emigre fuse ray gun', 'reproduce at 400%', 'do not align'][k % 6], 120 + (k % 3) * 560, 160 + k * 100 - tq * 40, { font: GR_C, size: 30, color: GR.bone, ls: 4 });
        c.globalAlpha = 1;
        GR_WORDS.forEach((Wd, i) => {
          const end = i < GR_WORDS.length - 1 ? GR_WORDS[i + 1].at + 0.06 : GR_T.cut;
          if (tq < Wd.at || tq >= end) return;
          const age = tq - Wd.at, fl = 0.7 + hash(fr * 2.3 + i) * 0.3;
          const [jx, jy] = weave(18, i * 9);
          const img = st.words[i];
          c.save(); c.translate(Wd.x + jx, Wd.y + jy); c.rotate(Wd.r + (hash(fr + i) - 0.5) * 0.03);
          const s = 1 + age * 0.08;
          c.scale(s, s);
          // double exposure: a fainter, larger ghost drifts off the main print
          c.globalAlpha = 0.28 * fl; c.drawImage(img, -750 * 1.05 + 14, -180 * 1.05 - 10, 1500 * 1.05, 360 * 1.05);
          c.globalAlpha = fl; c.drawImage(img, -750, -180);
          c.restore();
        });
        c.globalAlpha = 1;
        c.restore();
        // vertical emulsion scratches and dust, new every frame
        c.strokeStyle = 'rgba(240,235,220,0.35)'; c.lineWidth = 1.5;
        for (let k = 0; k < 4; k++) { const x = hash(fr * 7 + k) * W; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (hash(fr + k * 3) - 0.5) * 30, H); c.stroke(); }
        c.fillStyle = 'rgba(240,235,220,0.5)';
        for (let k = 0; k < 18; k++) c.fillRect(hash(fr * 11 + k) * W, hash(fr * 13 + k) * H, 2 + hash(k + fr) * 5, 2 + hash(k * 3 + fr) * 3);
        // gate edge
        c.fillStyle = '#000'; c.fillRect(0, 0, 46 + gx, H); c.fillRect(W - 46 + gx, 0, 60, H);
        vignette(c, W, H, 0.7);
        grain(c, W, H, t, 0.06, 'screen');
        return;
      }

      // ---------- 2. the spread ----------
      const sl = (a, d = 0.45) => E.outQt(seg(t, a, a + d));
      const slip = t >= GR_T.slip ? E.inQ(seg(t, GR_T.slip, GR_T.title)) : 0;
      const spreadOn = t < GR_T.title;
      if (spreadOn) {
        const climax = seg(t, GR_T.slab, GR_T.tear), jit = t > GR_T.slab ? weave(10 + climax * 20, 4) : weave(3, 4);
        c.save(); c.translate(0, -slip * H);
        c.drawImage(st.paper, 0, 0);
        c.save(); c.translate(jit[0], jit[1]);
        const drift = t - GR_T.cut;
        // giant word, cropped and bleeding
        c.drawImage(st.big, lerp(300, -60, sl(GR_T.cut, 0.6)) - drift * 30, -240);
        // photo strip
        const py = lerp(1080, 0, sl(GR_T.cut + 0.05, 0.5)) - drift * 14;
        c.drawImage(st.photo, 1180, py);
        // hairline rules crossing everything
        c.strokeStyle = GR.blk; c.lineWidth = 1.5;
        [[0, 300, 1920, 250], [240, 0, 330, 1080], [0, 940, 1920, 990], [1700, 0, 1640, 1080]].forEach(([a, b, x2, y2], i) => {
          const u = sl(GR_T.cut + 0.2 + i * 0.08, 0.35); c.beginPath(); c.moveTo(a, b); c.lineTo(lerp(a, x2, u), lerp(b, y2, u)); c.stroke();
        });
        // columns, overlapping each other and the photograph
        const ref = t > GR_T.reflow ? E.ioX(seg(t, GR_T.reflow, GR_T.reflow + 0.35)) : 0;
        const cols = [[st.colA, 300, 200, -0.02, 0.1], [st.colB, 1090 - ref * 180, 120, 0.06, 0.2], [st.colD, 1480 + ref * 60, 60, -0.04, 0.3]];
        cols.forEach(([img, x, y, a, d], i) => {
          const u = sl(GR_T.cut + d, 0.5);
          c.save(); c.translate(x, lerp(y + (i % 2 ? -900 : 900), y, u) - drift * (8 + i * 10)); c.rotate(a + (i === 1 ? ref * 0.05 : 0));
          c.globalAlpha = i === 1 ? 0.85 : 1; c.drawImage(img, 0, 0); c.restore();
        });
        c.globalAlpha = 1;
        // a redaction bar sweeps a column
        const rb = sl(GR_T.reflow + 0.2, 0.3);
        if (rb > 0) { c.fillStyle = GR.blk; c.fillRect(290, 520, 330 * rb, 56); c.fillRect(300, 610, 210 * rb, 26); }
        // the headline, five fonts at once, each letter landing on its own frame
        let hx = 110;
        GR_HEAD.forEach(([ch, fk, size, dx, dy, rot, ck], i) => {
          const F = GR_FONT[fk], at = GR_T.cut + 0.25 + i * 0.06;
          c.font = `${F[2]} ${F[1]} ${size}px ${F[0]}`;
          const w = c.measureText(ch).width;
          hx += dx;
          if (tq >= at) {
            const [jx, jy] = tq < at + 0.25 ? weave(40, i) : (t > GR_T.slab ? weave(16 * climax, i) : [0, 0]);
            const rj = t > GR_T.reflow && t < GR_T.reflow + 0.5 ? (hash(fr + i) - 0.5) * 0.3 : 0;
            c.save(); c.translate(hx + w / 2 + jx, 900 + dy + jy - drift * 6); c.rotate(rot + rj);
            text(c, ch, 0, rot === PI ? size * 0.5 : 0, { font: F[0], weight: F[1], style: F[2], size, color: GR_COL[ck], align: 'center' });
            c.restore();
          }
          hx += w;
        });
        // folios and marginalia
        if (t > GR_T.cut + 0.4) {
          text(c, 'ISSUE 23   ·   pg 67', 70, 60, { font: GR_C, size: 22, weight: 700, color: GR.blk, ls: 6 });
          text(c, 'interview / continued on page 104, maybe', 1850, 1050, { font: GR_C, size: 20, color: GR.blk, align: 'right', ls: 2 });
          c.save(); c.translate(1880, 140); c.rotate(PI / 2); text(c, 'READ  THIS  SIDEWAYS', 0, 0, { font: GR_A, size: 44, color: GR.rust, ls: 12 }); c.restore();
        }
        c.restore();

        // ---------- 3. slabs: SIGNAL against NOISE ----------
        if (t >= GR_T.slab) {
          const sw = E.ioX(seg(t, GR_T.swap, GR_T.swap + 0.3));
          const inU = E.outQt(seg(t, GR_T.slab, GR_T.slab + 0.25));
          const bx = lerp(lerp(1920, 960, inU), 0, sw), [jx, jy] = weave(8, 21);
          c.fillStyle = GR.blk; c.fillRect(bx + jx, 0, 960, H);
          c.save(); c.beginPath(); c.rect(bx + jx, 0, 960, H); c.clip();
          c.save(); c.translate(bx + 480 + jx, 660 + jy); c.scale(1.06, 1.25);
          text(c, 'SIGNAL', 0, 0, { font: GR_A, size: 300, color: GR.bone, align: 'center' });
          c.restore(); c.restore();
          const nx = bx > 480 ? bx - 480 : bx + 1440;
          c.save(); c.translate(nx - jx, 560 - jy); c.rotate(-0.05); c.scale(0.8, 1.4);
          text(c, 'NOISE', 0, 0, { font: GR_A, size: 300, color: GR.rust, align: 'center' });
          c.restore();
          grErode(c, st.tex, W, H, (fr * 137) % 1024, (fr * 61) % 1024, 0.25);
        }
        c.restore();

        // ---------- 4. the tear: sample the frame back into displaced slices ----------
        if (t >= GR_T.tear) {
          const amt = E.inQ(seg(t, GR_T.tear, GR_T.slip + 0.1));
          const k = c.canvas.width / W;
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
          // slices re-pick only four times a second (no full-frame strobing); their offset ramps smoothly
          const n = 14, fs = Math.floor(t * 4);
          for (let i = 0; i < n; i++) {
            const y0 = Math.floor(hash(i * 7 + fs) * H * k), h = Math.floor((20 + hash(i * 3 + fs) * 90) * k);
            const dx = (hash(i * 11 + fs * 3) - 0.5) * 420 * amt * k;
            c.drawImage(c.canvas, 0, y0, c.canvas.width, h, dx, y0, c.canvas.width, h);
          }
          c.restore();
        }
      }

      // ---------- 5. the title ----------
      if (t >= GR_T.slip) {
        const oy = spreadOn ? H * (1 - slip) : 0;
        c.save(); c.translate(0, oy);
        c.drawImage(st.paper, 0, 0);
        // frame line between the two frames
        if (spreadOn) { c.fillStyle = '#000'; c.fillRect(0, -40, W, 40); }
        const tt = t - GR_T.title, [wx, wy] = weave(tt < 0.8 ? 10 : 3, 50);
        c.save(); c.translate(wx, wy);
        // a column of body text crossing behind the title
        c.save(); c.globalAlpha = 0.5; c.translate(1240, -40); c.rotate(0.1); c.drawImage(st.colA, 0, 0); c.restore();
        c.globalAlpha = 1;
        // misregistered grey ghost, then the eroded black title, sliced in on arrival
        const set = E.outQt(seg(t, GR_T.title, GR_T.title + 0.7));
        c.globalAlpha = 0.45 * set; c.drawImage(st.title, 16, 196);
        c.globalAlpha = 1;
        const n = 10, sh = 640 / n;
        for (let i = 0; i < n; i++) {
          const dx = (1 - set) * (hash(i * 5 + fr) - 0.5) * 900 + (tt > 0.7 ? 0 : (hash(i + fr) - 0.5) * 40 * (1 - set));
          c.drawImage(st.title, 0, i * sh, 1920, sh, dx, 180 + i * sh, 1920, sh);
        }
        // a rust bar, scratched
        const bu = E.outQt(seg(t, GR_T.typo - 0.15, GR_T.typo + 0.2));
        c.fillStyle = GR.rust; c.fillRect(180, 766, 1100 * bu, 14);
        // "typography" in Bodoni italic, overprinted across the bottom of the letters
        const yu = E.outQt(seg(t, GR_T.typo, GR_T.typo + 0.45));
        if (yu > 0) {
          c.save(); c.translate(lerp(2300, 960, yu), 748); c.rotate(-0.045);
          c.globalCompositeOperation = 'multiply';
          text(c, 'typography', 0, 0, { font: GR_B, style: 'italic', weight: 700, size: 156, color: GR.rust });
          c.restore();
        }
        // typewritten captions
        const cap = (s, x, y, at, o) => { const nn = Math.floor(seg(t, at, at + 0.45) * s.length); if (nn > 0) text(c, s.slice(0, nn), x, y, { font: GR_C, color: GR.blk, ...o }); };
        cap('RAY GUN  /  EMIGRE  /  FUSE  /  SE7EN', 186, 856, GR_T.cap, { size: 34, weight: 700, ls: 6 });
        cap('carson · brody · vanderlans · licko · cooper   1990 — 1999', 186, 902, GR_T.cap + 0.25, { size: 24, ls: 3 });
        cap('THE MOTION STYLE ATLAS', 70, 70, GR_T.cap + 0.1, { size: 22, weight: 700, ls: 8 });
        cap('family a  —  pg 10', 1850, 70, GR_T.cap + 0.2, { size: 22, ls: 4, align: 'right' });
        const du = seg(t, GR_T.cap + 0.4, GR_T.cap + 0.8);
        if (du > 0) { c.save(); c.translate(1760, 990); c.rotate(-0.08); c.globalAlpha = du; text(c, 'illegible ≠ unreadable', 0, 0, { font: GR_H, size: 30, color: GR.blk, align: 'right' }); c.restore(); }
        c.restore();
        c.restore();
      }
      grain(c, W, H, t, 0.045, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // tape hiss and a low, crushed drone under the film section
      A.noise(0, { type: 'highpass', f: 4000, dur: GR_T.cut, g: 0.02, hold: true, rel: 0.05 });
      A.osc(0, { type: 'sawtooth', f: midi(28), dur: GR_T.cut, g: 0.06, lp: 260, hold: true, rel: 0.02, crush: true });
      A.osc(0, { type: 'sawtooth', f: midi(28) * 1.01, dur: GR_T.cut, g: 0.04, lp: 400, hold: true, rel: 0.02 });
      // each scratched word: a reversed swell into a metallic clank
      GR_WORDS.forEach((Wd, i) => {
        A.noise(Wd.at - 0.3, { type: 'bandpass', f: 600, f2: 3000, q: 2, dur: 0.3, g: 0.08, swell: 0.95 });
        A.bell(Wd.at, 180 + i * 37, { g: 0.07, dur: 0.6, ratios: [1, 2.41, 3.93, 5.77], rev: 0.3 });
        A.noise(Wd.at, { type: 'bandpass', f: 1200, f2: 400, q: 3, dur: 0.12, g: 0.07, crush: true });
        A.kick(Wd.at, 0.3, { f: 70, f2: 35 });
      });
      for (let k = 0; k < 16; k++) A.noise(0.1 + k * 0.166, { type: 'highpass', f: 6000, dur: 0.01, g: 0.04 * hash(k) });
      // hard cut: a fuzzed power chord and the beat
      const fuzz = (t, root, dur, g = 0.05) => [0, 7, 12].forEach((iv, j) => {
        A.osc(t, { type: 'sawtooth', f: midi(root + iv), dur, g, lp: 1800, crush: true, hold: true, rel: 0.08, detune: j ? 8 : -8, pan: (j - 1) * 0.4 });
        A.osc(t, { type: 'square', f: midi(root + iv) * 0.998, dur, g: g * 0.5, lp: 1200, hold: true, rel: 0.08 });
      });
      fuzz(GR_T.cut, 28, 1.6, 0.05); A.impact(GR_T.cut, 0.5, { rev: 0.3 });
      const B = GR_T.beat;
      for (let k = 0; k < 6; k++) {
        const t = GR_T.cut + k * B; if (t >= GR_T.slab) break;
        A.kick(t, 0.7, { f: 110, f2: 38 });
        A.snare(t + B / 2, 0.3, { f: 1500, rev: 0.25 });
        A.hat(t + B / 4, 0.04, false); A.hat(t + B * 0.75, 0.05, true);
        A.osc(t, { type: 'sawtooth', f: midi(28 + [0, 0, 3, 5, 0, 7][k]), dur: B * 0.9, g: 0.08, lp: 500, crush: true });
      }
      fuzz(GR_T.reflow, 31, 0.9, 0.045);
      A.noise(GR_T.reflow, { type: 'bandpass', f: 3000, f2: 600, q: 4, dur: 0.3, g: 0.06, crush: true });
      // headline letters: a tick each
      GR_HEAD.forEach((_, i) => A.noise(GR_T.cut + 0.25 + i * 0.06, { type: 'bandpass', f: 2200 + hash(i) * 2000, q: 5, dur: 0.02, g: 0.06 }));
      // slabs: double time, the chord climbs
      fuzz(GR_T.slab, 33, 0.6, 0.05); fuzz(GR_T.swap, 34, 0.4, 0.05);
      for (let k = 0; k < 8; k++) { const t = GR_T.slab + k * B / 2; A.kick(t, 0.6, { f: 100, f2: 36 }); if (k % 2) A.snare(t, 0.28, { f: 1800 }); }
      A.whoosh(GR_T.slab - 0.05, 0.3, { f1: 3000, f2: 300, g: 0.12 }); A.whoosh(GR_T.swap - 0.05, 0.3, { f1: 300, f2: 3000, g: 0.12 });
      // the tear: crushed noise stutters
      for (let k = 0; k < 10; k++) A.noise(GR_T.tear + k * 0.04, { type: 'bandpass', f: 500 + hash(k * 5) * 4000, q: 3, dur: 0.03, g: 0.1, crush: true });
      // the slip: tape stops
      A.osc(GR_T.slip, { type: 'sawtooth', f: midi(40), f2: midi(16), glide: 0.2, dur: 0.22, g: 0.08, lp: 1500 });
      // title: one last slam, feedback rings out
      A.kick(GR_T.title, 0.9, { f: 120, f2: 32, dur: 0.7 }); A.impact(GR_T.title, 0.6, { rev: 0.5 });
      fuzz(GR_T.title, 28, 1.3, 0.045);
      A.snare(GR_T.title, 0.35, { f: 1400, rev: 0.5 });
      A.osc(GR_T.title + 0.2, { f: midi(83), dur: 2.0, g: 0.025, a: 0.6, vib: [5, 6], rev: 0.5, lp: 3000 });
      A.whoosh(GR_T.typo, 0.4, { f1: 2500, f2: 400, g: 0.08 }); A.snare(GR_T.typo + 0.4, 0.2, { f: 1600, rev: 0.4 });
      for (let k = 0; k < 18; k++) A.noise(GR_T.cap + k * 0.04, { type: 'bandpass', f: 2400 + hash(k) * 800, q: 3, dur: 0.02, g: 0.04 });
      A.bell(9.2, 200, { g: 0.05, dur: 0.8, ratios: [1, 2.41, 3.93] });
    },
  });

})();
