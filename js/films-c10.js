/* batch c10 — Retro Desktop UI (G), Webcore / Web 1.0 (G), Audio Reactive (E). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, rrect, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&family=Arimo:wght@400;700&family=Fira+Sans:ital,wght@0,400;0,700;1,700;1,800&family=Tinos:ital,wght@0,400;0,700;1,700&family=Comic+Neue:wght@700&family=Archivo+Black&family=IBM+Plex+Mono:wght@400;600&display=block');
  const PIX = '"Pixelify Sans", monospace';
  const ARI = 'Arimo, Arial, sans-serif';
  const FIRA = '"Fira Sans", sans-serif';
  const TIN = 'Tinos, "Times New Roman", serif';
  const COMIC = '"Comic Neue", "Comic Sans MS", cursive';
  const BLACK = '"Archivo Black", Impact, sans-serif';
  const MONO = '"IBM Plex Mono", monospace';
  const mk = (w, h) => { const c = offscreen(w, h); return { c, g: c.getContext('2d') }; };
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // keyframed 2D path: keys [[t, x, y, ease?], ...]
  const path2 = (t, keys) => [kf(t, keys.map(k => [k[0], k[1], k[3]])), kf(t, keys.map(k => [k[0], k[2], k[3]]))];

  /* ---------- 1-bit text: rasterised, thresholded, tinted, cached ---------- */
  const BT = new Map();
  let scratch = null;
  function bitText(s, px, fam, wt, col, th) {
    const spec = `${wt} ${px}px ${fam}`;
    const ok = document.fonts && document.fonts.check ? document.fonts.check(spec) : true;
    const key = s + '|' + spec + '|' + col + '|' + th + '|' + ok;
    let e = BT.get(key);
    if (e) return e;
    if (!scratch) scratch = offscreen(8, 8).getContext('2d');
    scratch.font = spec;
    const m = scratch.measureText(s);
    const w = Math.ceil(m.width) + 6, h = Math.ceil(px * 1.7), base = Math.round(px * 1.2);
    const { c, g } = mk(w, h);
    g.font = spec; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
    g.fillText(s, 3, base);
    const d = g.getImageData(0, 0, w, h), a = d.data, [r, gg, b] = hex(col);
    for (let i = 0; i < a.length; i += 4) { const on = a[i + 3] >= th; a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = on ? 255 : 0; }
    g.putImageData(d, 0, 0);
    e = { c, w: m.width, base };
    BT.set(key, e);
    return e;
  }
  function bt(g, s, x, y, o = {}) {
    const e = bitText(s, o.size || 11, o.font || ARI, o.weight || 400, o.color || '#000000', o.th || 100);
    const dx = o.align === 'center' ? -e.w / 2 : o.align === 'right' ? -e.w : 0;
    g.drawImage(e.c, Math.round(x + dx - 3), Math.round(y - e.base));
    return e.w;
  }
  // smooth text helper
  function tx(g, s, x, y, size, fam, wt, col, align = 'left', style = '') {
    g.font = `${style} ${wt} ${size}px ${fam}`;
    g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = col;
    g.fillText(s, x, y);
  }

  /* =====================================================================
     G · RETRO DESKTOP UI — 1-bit 1984 → 16-colour 1995 → Luna 2001
     ===================================================================== */
  const DK = {
    chime: 0.1, on: 0.14, menubar: 0.5,
    dbl1: 0.9, dbl2: 1.0, zoomA: 1.03, zoomB: 1.27,
    grab: 1.42, drop: 1.88,
    menuDown: 2.1, menuUp: 2.46, alert: 2.54, ok: 2.9,
    dissA: 3.04, dissB: 3.38,
    w95: 3.3, grab95: 3.52, drop95: 3.9, copyA: 3.95, copyB: 4.46,
    start: 4.6, prog: 4.74, sol: 4.96, solZoom: 5.1, casc: 5.2, cascEnd: 6.5,
    black: 6.5, welcome: 6.68, desk: 7.3, winOpen: 7.46, grabXP: 7.62, dropXP: 7.94, balloon: 7.7,
    startXP: 8.08, turnOff: 8.33, red: 8.64, crt: 8.76, final: 9.04,
  };
  const ARROW = [
    'B..........', 'BB.........', 'BWB........', 'BWWB.......', 'BWWWB......', 'BWWWWB.....', 'BWWWWWB....',
    'BWWWWWWB...', 'BWWWWWWWB..', 'BWWWWWWWWB.', 'BWWWWWWWWWB', 'BWWWWWWBBBB', 'BWWWBWWB...', 'BWWBBWWB...',
    'BWB..BWWB..', 'BB...BWWB..', 'B.....BWWB.', '......BWWB.', '.......BB..',
  ];
  function pixArrow(g, x, y) {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < ARROW.length; j++) for (let i = 0; i < 11; i++) {
      const ch = ARROW[j][i];
      if (ch === '.') continue;
      g.fillStyle = ch === 'B' ? '#000' : '#fff';
      g.fillRect(x + i, y + j, 1, 1);
    }
  }

  /* ---------- 1984: 1-bit ---------- */
  const MAC = { W: 640, H: 360, win: { x: 120, y: 56, w: 360, h: 226 } };
  function macIcon(g, kind, cx, cy, inv) {
    const x = Math.round(cx - 16), y = Math.round(cy - 16);
    const L = inv ? '#fff' : '#000', F = inv ? '#000' : '#fff';
    const R = (a, b, c, d, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, c, d); };
    const box = (a, b, c, d) => { R(a, b, c, d, L); R(a + 1, b + 1, c - 2, d - 2, F); };
    if (kind === 'disk') {
      box(4, 3, 24, 26); R(10, 3, 13, 9, L); R(18, 4, 3, 6, F); box(8, 16, 16, 13);
      R(10, 19, 12, 1, L); R(10, 22, 12, 1, L); R(10, 25, 8, 1, L); R(4, 3, 2, 2, F);
    } else if (kind === 'trash' || kind === 'trashFull') {
      box(8, 10, 16, 20);
      if (kind === 'trash') { box(6, 7, 20, 4); R(13, 5, 6, 3, L); R(14, 6, 4, 1, F); }
      else {
        g.save(); g.translate(x + 16, y + 8); g.rotate(-0.28); g.fillStyle = L; g.fillRect(-11, -3, 22, 4); g.fillStyle = F; g.fillRect(-10, -2, 20, 2); g.restore();
        box(11, 3, 9, 9); R(13, 6, 5, 1, L); box(17, 5, 7, 7);
      }
      for (let k = 0; k < 3; k++) R(12 + k * 4, 13, 1, 14, L);
    } else if (kind === 'folder') {
      box(3, 9, 26, 19); box(3, 6, 11, 4); R(4, 9, 9, 1, F); R(3, 12, 26, 1, L);
    } else if (kind === 'doc') {
      box(7, 3, 18, 26); R(19, 3, 6, 6, F);
      for (let k = 0; k < 6; k++) R(19 + k, 3 + k, 1, 1, L);
      R(19, 3, 1, 6, L); R(19, 8, 6, 1, L);
      for (let k = 0; k < 5; k++) R(10, 12 + k * 3, k === 4 ? 7 : 12, 1, L);
    } else if (kind === 'paint' || kind === 'write') {
      g.save(); g.translate(x + 16, y + 16);
      g.beginPath(); g.moveTo(0, -14); g.lineTo(14, 0); g.lineTo(0, 14); g.lineTo(-14, 0); g.closePath();
      g.fillStyle = F; g.fill(); g.strokeStyle = L; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = L;
      if (kind === 'paint') { g.rotate(0.7); g.fillRect(-2, -9, 4, 12); g.fillRect(-3, 3, 6, 5); }
      else { g.rotate(-0.7); g.fillRect(-1.5, -10, 3, 14); g.beginPath(); g.moveTo(-1.5, 4); g.lineTo(1.5, 4); g.lineTo(0, 9); g.fill(); }
      g.restore();
    } else if (kind === 'alert') {
      box(2, 2, 28, 28); R(4, 4, 24, 24, L); R(14, 7, 4, 13, F); R(14, 22, 4, 4, F);
    }
  }
  function macLabel(g, s, cx, y, inv) {
    g.font = `400 11px ${PIX}`;
    const w = Math.ceil(g.measureText(s).width) + 6;
    g.fillStyle = inv ? '#000' : '#fff';
    g.fillRect(Math.round(cx - w / 2), y, w, 13);
    tx(g, s, Math.round(cx), y + 10, 11, PIX, 400, inv ? '#fff' : '#000', 'center');
  }
  function drawMac(g, t, st) {
    const { W, H } = MAC;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (t < DK.on) return;
    g.fillStyle = st.macPat; g.fillRect(0, 0, W, H);
    // boot: welcome box
    if (t < DK.menubar) {
      const bx = 220, by = 150, bw = 200, bh = 60;
      g.fillStyle = '#000'; g.fillRect(bx, by, bw, bh); g.fillStyle = '#fff'; g.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
      g.fillStyle = '#000'; g.fillRect(bx + 3, by + 3, bw - 6, bh - 6); g.fillStyle = '#fff'; g.fillRect(bx + 5, by + 5, bw - 10, bh - 10);
      if (t > DK.on + 0.08) tx(g, 'Welcome.', 320, 186, 16, PIX, 600, '#000', 'center');
      return;
    }
    // menu bar
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, 19); g.fillStyle = '#000'; g.fillRect(0, 19, W, 1);
    const menuOpen = t >= DK.menuDown && t < DK.menuUp + 0.1;
    // a generic eight-point star as the system menu glyph
    g.save(); g.translate(18, 10); g.fillStyle = '#000';
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4); g.fillRect(-1, -6, 2, 12); }
    g.restore();
    const items = [['File', 34], ['Edit', 70], ['View', 106], ['Special', 146]];
    items.forEach(([s, x], i) => {
      const hi = i === 3 && menuOpen && !(t > DK.menuUp && Math.floor((t - DK.menuUp) / 0.03) % 2 === 0);
      if (hi) { g.fillStyle = '#000'; g.fillRect(x - 6, 1, g.measureText ? 62 : 60, 18); }
      tx(g, s, x, 14, 13, PIX, 600, hi ? '#fff' : '#000');
    });
    tx(g, '10:24', 622, 14, 13, PIX, 600, '#000', 'right');
    // desktop icons
    const sel = t >= DK.dbl1;
    if (t >= DK.menubar + 0.04) { macIcon(g, 'disk', 600, 42, sel && t < DK.zoomB + 0.2); macLabel(g, 'System Disk', 600, 60, sel && t < DK.zoomB + 0.2); }
    const trashHot = t > DK.drop - 0.1 && t < DK.drop;
    if (t >= DK.menubar + 0.09) { macIcon(g, t >= DK.drop ? 'trashFull' : 'trash', 600, 314, trashHot); macLabel(g, 'Trash', 600, 333, trashHot); }
    // zoom rects
    const zw = MAC.win;
    if (t > DK.zoomA && t < DK.zoomB + 0.05) {
      for (let k = 0; k < 6; k++) {
        const p = seg(t, DK.zoomA + k * 0.025, DK.zoomB - 0.1 + k * 0.025);
        if (p <= 0 || p >= 1) continue;
        const q = E.inQ(p);
        const rx = lerp(584, zw.x, q), ry = lerp(26, zw.y, q), rw = lerp(32, zw.w, q), rh = lerp(32, zw.h, q);
        g.lineWidth = 1;
        g.strokeStyle = '#fff'; g.strokeRect(Math.round(rx) + 1.5, Math.round(ry) + 1.5, Math.round(rw) - 2, Math.round(rh) - 2);
        g.strokeStyle = '#000'; g.strokeRect(Math.round(rx) + 0.5, Math.round(ry) + 0.5, Math.round(rw), Math.round(rh));
      }
    }
    if (t >= DK.zoomB) {
      const { x, y, w, h } = zw;
      g.fillStyle = '#000'; g.fillRect(x + 2, y + 2, w, h); // drop shadow
      g.fillRect(x, y, w, h); g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      for (let k = 0; k < 6; k++) { g.fillStyle = '#000'; g.fillRect(x + 2, y + 4 + k * 2, w - 4, 1); }
      g.fillStyle = '#000'; g.fillRect(x, y + 18, w, 1);
      g.fillStyle = '#fff'; g.fillRect(x + 10, y + 3, 13, 13); g.fillStyle = '#000'; g.fillRect(x + 12, y + 4, 11, 11); g.fillStyle = '#fff'; g.fillRect(x + 13, y + 5, 9, 9);
      g.fillStyle = '#fff'; g.fillRect(x + w / 2 - 50, y + 2, 100, 15);
      tx(g, 'System Disk', x + w / 2, y + 14, 13, PIX, 600, '#000', 'center');
      const left = t >= DK.drop ? 5 : 6;
      tx(g, `${left} items`, x + 10, y + 31, 11, PIX, 400, '#000');
      tx(g, '312K in disk', x + w / 2, y + 31, 11, PIX, 400, '#000', 'center');
      tx(g, '88K available', x + w - 26, y + 31, 11, PIX, 400, '#000', 'right');
      g.fillStyle = '#000'; g.fillRect(x, y + 35, w, 1); g.fillRect(x, y + 37, w, 1);
      // scroll bars
      g.fillStyle = st.macPat; g.fillRect(x + w - 16, y + 38, 15, h - 55); g.fillRect(x + 1, y + h - 16, w - 17, 15);
      g.fillStyle = '#000'; g.fillRect(x + w - 17, y + 38, 1, h - 39); g.fillRect(x, y + h - 17, w - 1, 1);
      const icons = [['folder', 'System Folder', 55, 82], ['paint', 'Paint', 140, 82], ['write', 'Write', 225, 82], ['doc', 'Letter', 300, 82], ['folder', 'Games', 55, 160], ['doc', 'Read Me', 140, 160]];
      icons.forEach(([k, s, ix, iy], i) => {
        if (i === 3 && t >= DK.drop) return;
        const p = seg(t, DK.zoomB + i * 0.02, DK.zoomB + 0.06 + i * 0.02);
        if (p <= 0) return;
        const hot = i === 3 && t >= DK.grab;
        macIcon(g, k, x + ix, y + iy, hot); macLabel(g, s, x + ix, y + iy + 18, hot);
      });
    }
    // drag outline
    const cur = macCursor(t);
    if (t >= DK.grab && t < DK.drop) {
      const dx = cur[0] - (zw.x + 300), dy = cur[1] - (zw.y + 82);
      const ox = Math.round(zw.x + 300 + dx), oy = Math.round(zw.y + 82 + dy);
      g.lineWidth = 1;
      [['#fff', 1.5, -2], ['#000', 0.5, 0]].forEach(([col, o, d]) => {
        g.strokeStyle = col;
        g.strokeRect(ox - 9 + o, oy - 13 + o, 18 + d, 26 + d);
        g.strokeRect(ox - 18 + o, oy + 19 + o, 36 + d, 12 + d);
      });
    }
    // Special menu
    if (menuOpen) {
      const mx = 140, my = 20, mw = 132;
      const list = ['Clean Up Window', 'Empty Trash', 'Erase Disk...', 'Set Startup...', '-', 'Upgrade...'];
      let yy = my + 2; const rows = [];
      list.forEach(s => { rows.push([s, yy]); yy += s === '-' ? 8 : 17; });
      const mh = yy - my + 2;
      g.fillStyle = '#000'; g.fillRect(mx + 2, my + 2, mw, mh); g.fillRect(mx, my, mw, mh); g.fillStyle = '#fff'; g.fillRect(mx + 1, my, mw - 2, mh - 1);
      rows.forEach(([s, ry]) => {
        if (s === '-') { g.fillStyle = st.macPat; g.fillRect(mx + 1, ry + 3, mw - 2, 1); return; }
        const hot = cur[1] >= ry && cur[1] < ry + 17 && t < DK.menuUp + 0.1 && (t <= DK.menuUp || Math.floor((t - DK.menuUp) / 0.025) % 2 === 1);
        if (hot) { g.fillStyle = '#000'; g.fillRect(mx + 1, ry, mw - 2, 17); }
        tx(g, s, mx + 14, ry + 13, 13, PIX, 600, hot ? '#fff' : '#000');
      });
    }
    // alert
    if (t >= DK.alert && t < DK.ok + 0.08) {
      const ax = 150, ay = 118, aw = 340, ah = 120;
      g.fillStyle = '#000'; g.fillRect(ax, ay, aw, ah); g.fillStyle = '#fff'; g.fillRect(ax + 1, ay + 1, aw - 2, ah - 2);
      g.fillStyle = '#000'; g.fillRect(ax + 3, ay + 3, aw - 6, ah - 6); g.fillStyle = '#fff'; g.fillRect(ax + 6, ay + 6, aw - 12, ah - 12);
      macIcon(g, 'alert', ax + 38, ay + 40, false);
      tx(g, 'Upgrade to colour & windows?', ax + 70, ay + 34, 13, PIX, 600, '#000');
      tx(g, 'Your desktop will need about', ax + 70, ay + 52, 11, PIX, 400, '#000');
      tx(g, 'eleven years. Continue?', ax + 70, ay + 66, 11, PIX, 400, '#000');
      const btn = (bx, s, def, pressed) => {
        if (def) { g.fillStyle = '#000'; rrect(g, bx - 4, ay + 82, 78, 30, 9); g.fill(); g.fillStyle = '#fff'; rrect(g, bx - 1, ay + 85, 72, 24, 7); g.fill(); }
        g.fillStyle = '#000'; rrect(g, bx, ay + 86, 70, 22, 6); g.fill();
        g.fillStyle = pressed ? '#000' : '#fff'; rrect(g, bx + 1, ay + 87, 68, 20, 5); g.fill();
        tx(g, s, bx + 35, ay + 101, 13, PIX, 600, pressed ? '#fff' : '#000', 'center');
      };
      btn(ax + 150, 'Cancel', false, false);
      btn(ax + 246, 'OK', true, t >= DK.ok);
    }
    // cursor
    if (t >= DK.menubar) {
      if (t > DK.ok + 0.06) macWatch(g, cur[0], cur[1]);
      else pixArrow(g, cur[0], cur[1]);
    }
  }
  function macWatch(g, x, y) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = '#000'; g.fillRect(x - 3, y - 9, 7, 4); g.fillRect(x - 3, y + 6, 7, 4);
    g.beginPath(); g.arc(x + 0.5, y + 0.5, 7, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 0.5, y + 0.5, 5.5, 0, TAU); g.fill();
    g.fillStyle = '#000'; g.fillRect(x, y - 4, 1, 5); g.fillRect(x, y, 4, 1);
  }
  const MAC_CUR = [[0.5, 330, 210], [0.86, 602, 44, E.ioC], [1.04, 602, 44], [1.38, 420, 140, E.ioC], [DK.grab, 420, 140], [DK.drop - 0.06, 602, 316, E.ioC], [DK.drop + 0.06, 602, 316], [DK.menuDown - 0.02, 156, 9, E.ioC], [DK.menuDown + 0.06, 156, 9], [DK.menuUp - 0.04, 178, 112, E.ioC], [DK.alert + 0.04, 178, 112], [DK.ok - 0.04, 402, 216, E.ioC], [3.2, 402, 216]];
  const macCursor = t => path2(t, MAC_CUR);

  /* ---------- 1995: 16 colours ---------- */
  const W9 = { face: '#c0c0c0', hi: '#ffffff', lt: '#dfdfdf', sh: '#808080', dk: '#000000', navy: '#000080', teal: '#008080' };
  function bev(g, x, y, w, h, mode = 'raised') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const P = {
      raised: [W9.lt, W9.dk, W9.hi, W9.sh], button: [W9.hi, W9.dk, W9.lt, W9.sh],
      pressed: [W9.dk, W9.hi, W9.sh, W9.lt], sunken: [W9.sh, W9.hi, W9.dk, W9.lt], field: [W9.sh, W9.hi, W9.dk, W9.lt],
    }[mode];
    g.fillStyle = mode === 'field' ? '#fff' : W9.face; g.fillRect(x, y, w, h);
    g.fillStyle = P[0]; g.fillRect(x, y, w - 1, 1); g.fillRect(x, y, 1, h - 1);
    g.fillStyle = P[1]; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = P[2]; g.fillRect(x + 1, y + 1, w - 3, 1); g.fillRect(x + 1, y + 1, 1, h - 3);
    g.fillStyle = P[3]; g.fillRect(x + 1, y + h - 2, w - 2, 1); g.fillRect(x + w - 2, y + 1, 1, h - 2);
  }
  function w9Icon(g, kind, x, y, small) {
    const s = small ? 0.5 : 1;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    const R = (a, b, c, d, col) => { g.fillStyle = col; g.fillRect(a, b, c, d); };
    if (kind === 'computer') {
      R(4, 1, 24, 19, '#000'); R(5, 2, 22, 17, '#c0c0c0'); R(5, 2, 22, 1, '#fff'); R(5, 2, 1, 17, '#fff');
      R(8, 5, 16, 11, '#000'); R(9, 6, 14, 9, '#008080'); R(10, 7, 4, 2, '#00ffff');
      R(11, 20, 10, 3, '#808080'); R(2, 23, 28, 8, '#000'); R(3, 24, 26, 6, '#c0c0c0'); R(3, 24, 26, 1, '#fff');
      R(18, 26, 8, 2, '#000'); R(6, 26, 3, 2, '#00ff00');
    } else if (kind === 'bin') {
      g.beginPath(); g.moveTo(6, 7); g.lineTo(26, 7); g.lineTo(23, 30); g.lineTo(9, 30); g.closePath();
      g.fillStyle = '#dfdfdf'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
      for (let k = 0; k < 5; k++) R(10 + k * 3, 10, 1, 18, '#808080');
      R(5, 5, 22, 3, '#000'); R(6, 6, 20, 1, '#fff');
      R(12, 14, 8, 8, '#008000'); R(14, 16, 4, 4, '#00ff00');
    } else if (kind === 'folder' || kind === 'folderOpen') {
      R(2, 6, 12, 4, '#000'); R(3, 7, 10, 3, '#ffff80');
      R(2, 9, 28, 20, '#000'); R(3, 10, 26, 18, '#c0c000'); R(3, 10, 26, 1, '#ffff80');
      if (kind === 'folderOpen') { g.beginPath(); g.moveTo(6, 14); g.lineTo(31, 14); g.lineTo(27, 29); g.lineTo(2, 29); g.closePath(); g.fillStyle = '#ffff80'; g.fill(); g.strokeStyle = '#000'; g.stroke(); }
      else { R(3, 13, 26, 15, '#ffff80'); R(3, 13, 26, 1, '#fff'); R(3, 27, 26, 1, '#808000'); }
    } else if (kind === 'floppy') {
      R(2, 10, 28, 14, '#000'); R(3, 11, 26, 12, '#c0c0c0'); R(3, 11, 26, 1, '#fff');
      R(7, 15, 18, 3, '#000'); R(8, 16, 16, 1, '#404040'); R(23, 20, 4, 2, '#00ff00');
      // shortcut badge
      R(1, 21, 11, 11, '#000'); R(2, 22, 9, 9, '#fff');
      g.strokeStyle = '#000'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(4, 29); g.quadraticCurveTo(4, 24, 9, 24); g.stroke();
      R(7, 22, 3, 5, '#000');
    } else if (kind === 'doc') {
      R(6, 2, 20, 28, '#000'); R(7, 3, 18, 26, '#fff'); R(19, 2, 7, 7, '#c0c0c0');
      for (let k = 0; k < 6; k++) R(10, 9 + k * 3, k === 5 ? 8 : 12, 1, '#000080');
    } else if (kind === 'cards') {
      g.save(); g.translate(16, 18);
      [-0.35, 0, 0.35].forEach((r, i) => { g.save(); g.rotate(r); g.fillStyle = '#000'; g.fillRect(-7, -12, 14, 20); g.fillStyle = i === 2 ? '#fff' : '#0000a8'; g.fillRect(-6, -11, 12, 18); g.restore(); });
      g.fillStyle = '#c00000'; g.fillRect(2, -6, 3, 3); g.restore();
    } else if (kind === 'mini') {
      R(1, 1, 14, 10, '#000'); R(2, 2, 12, 8, '#008080'); R(5, 11, 6, 2, '#808080'); R(1, 13, 14, 3, '#000'); R(2, 13, 12, 2, '#c0c0c0');
    }
    g.restore();
  }
  function w9Label(g, s, cx, y, sel) {
    const e = bitText(s, 11, ARI, 400, '#ffffff', 100);
    const w = Math.ceil(e.w) + 4;
    if (sel) { g.fillStyle = W9.navy; g.fillRect(Math.round(cx - w / 2), y - 1, w, 14); }
    bt(g, s, cx, y + 10, { color: '#ffffff', align: 'center' });
  }
  function w9Glyph(g, k, cx, cy) {
    g.fillStyle = '#000';
    if (k === 'x') for (let i = 0; i < 7; i++) { g.fillRect(cx - 4 + i, cy - 3 + i, 2, 1); g.fillRect(cx + 2 - i, cy - 3 + i, 2, 1); }
    else if (k === 'max') { g.fillRect(cx - 4, cy - 4, 9, 2); g.fillRect(cx - 4, cy - 4, 1, 9); g.fillRect(cx + 4, cy - 4, 1, 9); g.fillRect(cx - 4, cy + 4, 9, 1); }
    else if (k === 'min') g.fillRect(cx - 3, cy + 2, 6, 2);
  }
  function w9Window(g, x, y, w, h, title, o = {}) {
    bev(g, x, y, w, h, 'raised');
    g.fillStyle = o.inactive ? W9.sh : W9.navy; g.fillRect(x + 3, y + 3, w - 6, 18);
    if (o.icon) w9Icon(g, o.icon, x + 5, y + 4, true);
    bt(g, title, x + (o.icon ? 24 : 6), y + 16, { color: '#ffffff', weight: 700 });
    const bx = x + w - 21;
    [['x', bx], ['max', bx - 18], ['min', bx - 34]].forEach(([k, xx]) => { bev(g, xx, y + 5, 16, 14, 'button'); w9Glyph(g, k, xx + 8, y + 12); });
  }
  function w9Hourglass(g, x, y) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = '#000'; g.fillRect(x, y, 13, 2); g.fillRect(x, y + 19, 13, 2);
    g.beginPath(); g.moveTo(x + 1, y + 2); g.lineTo(x + 12, y + 2); g.lineTo(x + 7.5, y + 10.5); g.lineTo(x + 12, y + 19); g.lineTo(x + 1, y + 19); g.lineTo(x + 5.5, y + 10.5); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + 3, y + 3); g.lineTo(x + 10, y + 3); g.lineTo(x + 6.5, y + 9.5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x + 6.5, y + 12); g.lineTo(x + 10, y + 18); g.lineTo(x + 3, y + 18); g.closePath(); g.fill();
    g.fillStyle = '#000'; g.fillRect(x + 4, y + 15, 5, 3); g.fillRect(x + 5, y + 5, 3, 2);
  }
  /* cards */
  function suitPath(g, s, cx, cy, z) {
    g.beginPath();
    if (s === 0) { // heart
      g.moveTo(cx, cy + z * 0.48);
      g.bezierCurveTo(cx - z * 0.95, cy - z * 0.08, cx - z * 0.42, cy - z * 0.78, cx, cy - z * 0.28);
      g.bezierCurveTo(cx + z * 0.42, cy - z * 0.78, cx + z * 0.95, cy - z * 0.08, cx, cy + z * 0.48);
    } else if (s === 1) { // diamond
      g.moveTo(cx, cy - z * 0.52); g.lineTo(cx + z * 0.38, cy); g.lineTo(cx, cy + z * 0.52); g.lineTo(cx - z * 0.38, cy);
    } else if (s === 2) { // spade
      g.moveTo(cx, cy - z * 0.52);
      g.bezierCurveTo(cx - z * 0.95, cy + z * 0.1, cx - z * 0.38, cy + z * 0.6, cx - z * 0.02, cy + z * 0.18);
      g.lineTo(cx - z * 0.2, cy + z * 0.52); g.lineTo(cx + z * 0.2, cy + z * 0.52); g.lineTo(cx + z * 0.02, cy + z * 0.18);
      g.bezierCurveTo(cx + z * 0.38, cy + z * 0.6, cx + z * 0.95, cy + z * 0.1, cx, cy - z * 0.52);
    } else { // club
      const r = z * 0.21;
      g.arc(cx, cy - z * 0.24, r, 0, TAU); g.moveTo(cx - z * 0.22 + r, cy + z * 0.06); g.arc(cx - z * 0.22, cy + z * 0.06, r, 0, TAU);
      g.moveTo(cx + z * 0.22 + r, cy + z * 0.06); g.arc(cx + z * 0.22, cy + z * 0.06, r, 0, TAU);
      g.moveTo(cx - z * 0.05, cy); g.lineTo(cx - z * 0.18, cy + z * 0.52); g.lineTo(cx + z * 0.18, cy + z * 0.52); g.lineTo(cx + z * 0.05, cy);
    }
    g.closePath();
  }
  const CW = 54, CH = 72;
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  function cardCanvas(rank, suit) {
    const { c, g } = mk(CW, CH);
    const red = suit < 2, col = red ? '#d00000' : '#000000';
    g.fillStyle = '#000'; rrect(g, 0, 0, CW, CH, 4); g.fill();
    g.fillStyle = '#fff'; rrect(g, 1, 1, CW - 2, CH - 2, 3); g.fill();
    const r = RANKS[rank];
    bt(g, r, 5, 13, { color: col, weight: 700, size: 11 });
    g.fillStyle = col; suitPath(g, suit, 8, 21, 9); g.fill();
    g.save(); g.translate(CW, CH); g.rotate(Math.PI);
    bt(g, r, 5, 13, { color: col, weight: 700, size: 11 }); suitPath(g, suit, 8, 21, 9); g.fillStyle = col; g.fill();
    g.restore();
    if (rank >= 10) {
      g.fillStyle = '#000'; g.fillRect(14, 10, 26, 52);
      g.fillStyle = '#ffd820'; g.fillRect(15, 11, 24, 50);
      g.fillStyle = red ? '#d00000' : '#0020a0'; g.fillRect(15, 34, 24, 4); g.fillRect(15, 11, 24, 6);
      g.fillStyle = '#fff'; g.fillRect(20, 18, 14, 14);
      g.fillStyle = '#e8b090'; g.fillRect(22, 20, 10, 10);
      g.fillStyle = '#000'; g.fillRect(24, 23, 2, 2); g.fillRect(28, 23, 2, 2);
      g.fillStyle = red ? '#0020a0' : '#d00000'; g.fillRect(15, 40, 24, 21);
      g.fillStyle = col; suitPath(g, suit, 27, 50, 14); g.fillStyle = '#fff'; g.fill();
      bt(g, r, 27, 31, { color: '#000000', weight: 700, size: 9, align: 'center' });
    } else {
      const n = rank + 1, L = 18, M = 27, Rr = 36;
      const rows = y => 15 + y * 42;
      let pips = [];
      if (n >= 7) { pips = [[L, 0], [Rr, 0], [L, 1], [Rr, 1]]; }
      if (n === 7) pips.push([L, 0.5], [Rr, 0.5], [M, 0.25]);
      if (n === 8) pips.push([L, 0.5], [Rr, 0.5], [M, 0.25], [M, 0.75]);
      if (n >= 9) { pips.push([L, 1 / 3], [Rr, 1 / 3], [L, 2 / 3], [Rr, 2 / 3]); }
      if (n === 9) pips.push([M, 0.5]);
      if (n === 10) pips.push([M, 1 / 6], [M, 5 / 6]);
      if (n < 7) pips = [[M, 0.5]];
      g.fillStyle = col;
      pips.forEach(([px, py]) => { suitPath(g, suit, px, rows(py), 10); g.fill(); });
    }
    return c;
  }
  function cardBack() {
    const { c, g } = mk(CW, CH);
    g.fillStyle = '#000'; rrect(g, 0, 0, CW, CH, 4); g.fill();
    g.fillStyle = '#fff'; rrect(g, 1, 1, CW - 2, CH - 2, 3); g.fill();
    g.fillStyle = '#0000a8'; g.fillRect(4, 4, CW - 8, CH - 8);
    g.fillStyle = '#5858ff';
    for (let y = 4; y < CH - 4; y += 4) for (let x = 4 + ((y / 4) % 2) * 2; x < CW - 4; x += 4) g.fillRect(x, y, 2, 2);
    return c;
  }
  // deterministic cascade: 26 cards leave the foundations, bounce and smear their trails
  function buildCascade() {
    const r = rng(1995), cards = [];
    const fx = i => 960 - 14 - (4 - i) * (CW + 10);
    const floor = 490 - CH, dt = 1 / 50;
    for (let n = 0; n < 26; n++) {
      const pile = n % 4, rank = 12 - Math.floor(n / 4);
      const t0 = DK.casc + n * 0.05;
      let x = fx(pile), y = 50, vx = (r() < 0.75 ? -1 : 1) * (150 + r() * 260), vy = -60 - r() * 260;
      const pts = [], bounces = [];
      for (let k = 0; k < 220; k++) {
        pts.push([x, y]);
        vy += 1500 * dt; x += vx * dt; y += vy * dt;
        if (y > floor) { y = floor; vy = -vy * 0.74; bounces.push(t0 + k * dt); }
        if (x < -CW || x > 960) break;
      }
      cards.push({ pile, rank, suit: [0, 2, 1, 3][pile], t0, dt, pts, bounces });
    }
    return cards;
  }

  function drawW95(g, t, st) {
    const W = 960, H = 540;
    g.fillStyle = W9.teal; g.fillRect(0, 0, W, H);
    const solOpen = t >= DK.solZoom;
    // desktop icons
    const dragging = t >= DK.grab95 && t < DK.drop95;
    const icons = [['computer', 'My Computer', 38, 18], ['bin', 'Recycle Bin', 38, 92], ['folder', 'My Documents', 38, 166], ['floppy', '3½ Floppy (A:)', 470, 196], ['cards', 'Solitaire', 38, 240]];
    icons.forEach(([k, s, cx, y], i) => {
      const sel = (i === 2 && t >= DK.grab95 && t < DK.copyB) || (i === 3 && t > DK.drop95 - 0.12 && t < DK.copyB);
      w9Icon(g, k, cx - 16, y); w9Label(g, s, cx, y + 36, sel);
    });
    const cur = w95Cursor(t);
    if (dragging) {
      g.save(); g.globalAlpha = 0.55;
      w9Icon(g, 'folder', cur[0] - 16 - 2, cur[1] - 16 + 2);
      g.restore();
    }
    // copy dialog
    if (t >= DK.copyA && t < DK.copyB) {
      const x = 300, y = 170, w = 360, h = 160;
      w9Window(g, x, y, w, h, 'Copying...');
      w9Icon(g, 'folderOpen', x + 26, y + 34); w9Icon(g, 'folder', x + w - 120, y + 34);
      for (let k = 0; k < 3; k++) {
        const p = ((t - DK.copyA) * 1.9 + k / 3) % 1;
        const px = lerp(x + 52, x + w - 112, p), py = y + 44 - Math.sin(p * Math.PI) * 26;
        const fw = Math.max(2, Math.abs(Math.cos(p * TAU * 1.5)) * 11);
        const lx = Math.round(px - fw / 2), ly = Math.round(py);
        g.fillStyle = '#000'; g.fillRect(lx - 1, ly - 1, Math.round(fw) + 2, 16);
        g.fillStyle = '#fff'; g.fillRect(lx, ly, Math.round(fw), 14);
        if (fw > 6) { g.fillStyle = '#000080'; for (let q = 0; q < 4; q++) g.fillRect(lx + 2, ly + 3 + q * 3, Math.round(fw) - 4, 1); g.fillStyle = '#c0c0c0'; g.fillRect(lx + Math.round(fw) - 3, ly, 3, 3); }
      }
      const files = ['letter.doc', 'budget95.xls', 'vacation.bmp', 'resume.txt', 'mixtape.wav', 'notes.txt'];
      const p = seg(t, DK.copyA + 0.05, DK.copyB - 0.06);
      bt(g, files[Math.min(5, Math.floor(p * 6))], x + 16, y + 90);
      bt(g, "From 'My Documents' to 'A:\\'", x + 16, y + 106);
      bev(g, x + 16, y + 118, w - 120, 18, 'sunken');
      const nb = Math.floor(p * 22);
      g.fillStyle = W9.navy;
      for (let k = 0; k < nb; k++) g.fillRect(x + 19 + k * 10, y + 121, 8, 12);
      bev(g, x + w - 90, y + 116, 76, 22, 'button'); bt(g, 'Cancel', x + w - 52, y + 131, { align: 'center' });
      bt(g, `${Math.max(0, Math.round((1 - p) * 9))} seconds remaining`, x + w - 120, y + 90, { color: '#000000', align: 'left' });
    }
    // solitaire caption-zoom
    if (t >= DK.sol && t < DK.solZoom + 0.02) {
      for (let k = 0; k < 3; k++) {
        const p = E.inQ(seg(t, DK.sol + k * 0.02, DK.solZoom));
        if (p <= 0) continue;
        const x = lerp(64, 3, p), y = lerp(516, 3, p), w = lerp(150, W - 6, p);
        if (k === 2) { g.fillStyle = W9.navy; g.fillRect(Math.round(x), Math.round(y), Math.round(w), 18); }
        else { g.strokeStyle = '#000080'; g.lineWidth = 1; g.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), 18); }
      }
    }
    if (solOpen) {
      w9Window(g, 0, 0, W, 512, 'Solitaire', { icon: 'cards' });
      g.fillStyle = W9.face; g.fillRect(3, 22, W - 6, 18);
      bt(g, 'Game', 12, 35); bt(g, 'Help', 52, 35);
      g.fillStyle = '#008000'; g.fillRect(3, 41, W - 6, 450);
      // status bar
      bev(g, 3, 491, W - 6, 18, 'raised');
      bev(g, W - 260, 493, 254, 14, 'sunken');
      bt(g, 'Score: 1,452     Time: 163', W - 252, 504);
      g.save(); g.beginPath(); g.rect(3, 41, W - 6, 450); g.clip();
      g.drawImage(st.back, 14, 50);
      g.strokeStyle = '#00c000'; g.lineWidth = 1; g.strokeRect(14 + CW + 10.5, 50.5, CW - 1, CH - 1);
      // foundations: the pile shows whatever card is still on top
      const cards = st.casc;
      const launched = cards.filter(c => t >= c.t0).length;
      for (let p = 0; p < 4; p++) {
        let top = 12;
        for (let n = 0; n < launched; n++) if (cards[n].pile === p) top = cards[n].rank - 1;
        const fx = 960 - 14 - (4 - p) * (CW + 10);
        g.drawImage(st.card(top, [0, 2, 1, 3][p]), fx, 50);
      }
      // tableau at rest before the win
      if (t < DK.casc) {
        for (let k = 0; k < 7; k++) g.strokeRect(14.5 + k * (CW + 10) + 200, 140.5, CW - 1, CH - 1);
      }
      cards.forEach(c => {
        if (t < c.t0) return;
        const n = Math.min(c.pts.length, Math.floor((t - c.t0) / c.dt) + 1);
        const img = st.card(c.rank, c.suit);
        for (let k = 0; k < n; k++) g.drawImage(img, Math.round(c.pts[k][0]), Math.round(c.pts[k][1]));
      });
      g.restore();
    }
    // taskbar
    const tb = 512;
    const tbIn = E.outC(seg(t, DK.w95 - 0.05, DK.w95 + 0.12));
    if (tbIn > 0) {
      g.save(); g.translate(0, Math.round((1 - tbIn) * 30));
      g.fillStyle = W9.face; g.fillRect(0, tb, W, 28); g.fillStyle = W9.lt; g.fillRect(0, tb, W, 1); g.fillStyle = W9.hi; g.fillRect(0, tb + 1, W, 1);
      const startOpen = t >= DK.start && t < DK.sol + 0.04;
      bev(g, 2, tb + 3, 56, 22, startOpen ? 'pressed' : 'button');
      w9Icon(g, 'mini', 6, tb + 6);
      bt(g, 'Start', 24, tb + 18, { weight: 700 });
      if (t >= DK.copyA && t < DK.copyB) { bev(g, 62, tb + 3, 150, 22, 'pressed'); bt(g, 'Copying...', 72, tb + 18); }
      if (solOpen) { bev(g, 62, tb + 3, 150, 22, 'pressed'); w9Icon(g, 'cards', 66, tb + 6, true); bt(g, 'Solitaire', 86, tb + 18, { weight: 700 }); }
      bev(g, W - 76, tb + 3, 74, 22, 'sunken');
      g.fillStyle = W9.face; g.fillRect(W - 74, tb + 5, 70, 18);
      w9Icon(g, 'mini', W - 72, tb + 6);
      bt(g, '6:12 PM', W - 10, tb + 18, { align: 'right' });
      g.restore();
    }
    // start menu
    if (t >= DK.start && t < DK.sol + 0.04) {
      const p = E.outC(seg(t, DK.start, DK.start + 0.1));
      const mh = 196, mw = 172, mx = 2, my = tb - mh + 2;
      g.save(); g.beginPath(); g.rect(0, my + mh * (1 - p), W, mh * p); g.clip();
      g.translate(0, mh * (1 - p));
      bev(g, mx, my, mw, mh, 'raised');
      g.fillStyle = W9.sh; g.fillRect(mx + 3, my + 3, 22, mh - 6);
      g.save(); g.translate(mx + 20, my + mh - 8); g.rotate(-Math.PI / 2);
      bt(g, 'Desktop', 0, 0, { color: '#c0c0c0', weight: 700, size: 15 }); bt(g, '95', 64, 0, { color: '#ffffff', size: 15, weight: 700 });
      g.restore();
      const items = ['Programs', 'Documents', 'Settings', 'Find', 'Help', 'Run...', '-', 'Shut Down...'];
      let yy = my + 4;
      items.forEach((s, i) => {
        if (s === '-') { g.fillStyle = W9.sh; g.fillRect(mx + 28, yy + 3, mw - 32, 1); g.fillStyle = W9.hi; g.fillRect(mx + 28, yy + 4, mw - 32, 1); yy += 8; return; }
        const hot = i === 0 && t >= DK.prog - 0.03;
        if (hot) { g.fillStyle = W9.navy; g.fillRect(mx + 26, yy, mw - 29, 24); }
        w9Icon(g, i === 0 ? 'folder' : i === 1 ? 'doc' : i === 7 ? 'computer' : i === 4 ? 'doc' : 'mini', mx + 30, yy + 4, true);
        bt(g, s, mx + 54, yy + 16, { color: hot ? '#ffffff' : '#000000' });
        if (i < 4) { g.fillStyle = hot ? '#fff' : '#000'; for (let k = 0; k < 4; k++) g.fillRect(mx + mw - 14 + k, yy + 8 + k, 1, 8 - k * 2); }
        yy += 24;
      });
      g.restore();
      if (t >= DK.prog) {
        const sx = mx + mw - 2, sy = my + 1, sw = 150;
        const sub = ['Accessories', 'File Manager', 'DOS Prompt', 'Paint', 'Solitaire'];
        bev(g, sx, sy, sw, sub.length * 22 + 6, 'raised');
        const cy = cur[1];
        sub.forEach((s, i) => {
          const y = sy + 3 + i * 22;
          const hot = cur[0] > sx && cy >= y && cy < y + 22;
          if (hot) { g.fillStyle = W9.navy; g.fillRect(sx + 3, y, sw - 6, 22); }
          w9Icon(g, i === 4 ? 'cards' : i === 0 ? 'folder' : 'mini', sx + 6, y + 3, true);
          bt(g, s, sx + 28, y + 15, { color: hot ? '#ffffff' : '#000000' });
        });
      }
    }
    // cursor
    if (t > DK.w95 && !(t > DK.casc - 0.02)) {
      if (t > DK.copyA + 0.03 && t < DK.copyB - 0.04) { pixArrow(g, cur[0], cur[1]); w9Hourglass(g, cur[0] + 10, cur[1] + 10); }
      else pixArrow(g, cur[0], cur[1]);
    }
  }
  const W95_CUR = [[DK.w95, 520, 330], [DK.grab95 - 0.02, 40, 178, E.ioC], [DK.grab95 + 0.03, 40, 178], [DK.drop95, 472, 210, E.ioC], [DK.copyB, 500, 260, E.ioC], [DK.start - 0.02, 28, 526, E.ioC], [DK.start + 0.04, 28, 526], [DK.prog, 70, 333, E.ioC], [DK.prog + 0.08, 240, 333, E.ioC], [DK.sol - 0.02, 240, 415, E.ioC], [DK.sol + 0.2, 240, 415], [DK.casc, 760, 400, E.ioC]];
  const w95Cursor = t => path2(t, W95_CUR);

  /* ---------- 2001: Luna ---------- */
  function xpWallpaper() {
    const { c, g } = mk(1920, 1080);
    g.scale(1.5, 1.5);
    const sky = g.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, '#1554c4'); sky.addColorStop(0.55, '#4b8fe2'); sky.addColorStop(1, '#a9d2f6');
    g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
    const r = rng(2001);
    for (let i = 0; i < 26; i++) {
      const cx = r() * 1400 - 60, cy = 60 + r() * 300, rr = 40 + r() * 110;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      gr.addColorStop(0, `rgba(255,255,255,${0.45 + r() * 0.35})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.translate(cx, cy); g.scale(1.9, 0.6); g.translate(-cx, -cy);
      g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); g.restore();
    }
    // far hill
    g.beginPath(); g.moveTo(0, 520); g.bezierCurveTo(300, 470, 700, 440, 1280, 470); g.lineTo(1280, 720); g.lineTo(0, 720); g.closePath();
    g.fillStyle = '#5c9f45'; g.fill();
    // main hill
    g.beginPath(); g.moveTo(0, 560); g.bezierCurveTo(240, 430, 560, 400, 820, 470); g.bezierCurveTo(1000, 520, 1150, 540, 1280, 530);
    g.lineTo(1280, 720); g.lineTo(0, 720); g.closePath();
    const hg = g.createLinearGradient(0, 400, 0, 720);
    hg.addColorStop(0, '#7cc23b'); hg.addColorStop(0.4, '#4f9a24'); hg.addColorStop(1, '#2a6e14');
    g.fillStyle = hg; g.fill();
    g.save(); g.clip();
    const sh = g.createRadialGradient(470, 430, 10, 470, 430, 420);
    sh.addColorStop(0, 'rgba(210,255,140,0.55)'); sh.addColorStop(1, 'rgba(210,255,140,0)');
    g.fillStyle = sh; g.fillRect(0, 380, 1280, 340);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '30,80,10' : '170,230,90'},${0.08 + r() * 0.1})`; g.fillRect(r() * 1280, 420 + r() * 300, 1.5, 3); }
    g.restore();
    return c;
  }
  function xpWelcome() {
    const { c, g } = mk(1920, 1080);
    g.scale(1.5, 1.5);
    g.fillStyle = '#5a7edc'; g.fillRect(0, 0, 1280, 720);
    const gl = g.createRadialGradient(150, 120, 0, 150, 120, 620);
    gl.addColorStop(0, 'rgba(160,190,255,0.85)'); gl.addColorStop(1, 'rgba(160,190,255,0)');
    g.fillStyle = gl; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#00309c'; g.fillRect(0, 0, 1280, 86); g.fillRect(0, 634, 1280, 86);
    const l1 = g.createLinearGradient(0, 0, 1280, 0);
    l1.addColorStop(0, 'rgba(255,255,255,0)'); l1.addColorStop(0.3, 'rgba(255,255,255,0.9)'); l1.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = l1; g.fillRect(0, 86, 1280, 2);
    const l2 = g.createLinearGradient(0, 0, 1280, 0);
    l2.addColorStop(0, 'rgba(255,170,60,0)'); l2.addColorStop(0.4, 'rgba(255,170,60,0.95)'); l2.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = l2; g.fillRect(0, 632, 1280, 2);
    return c;
  }
  function xpTitleGrad(g, y, h) {
    const tg = g.createLinearGradient(0, y, 0, y + h);
    tg.addColorStop(0, '#3e93ff'); tg.addColorStop(0.12, '#0a5fe8'); tg.addColorStop(0.5, '#0054e8'); tg.addColorStop(0.88, '#0d68f2'); tg.addColorStop(1, '#0047cc');
    return tg;
  }
  function xpCapBtn(g, x, y, k) {
    const red = k === 'x';
    const gr = g.createLinearGradient(0, y, 0, y + 21);
    if (red) { gr.addColorStop(0, '#f19a7c'); gr.addColorStop(0.5, '#e2532c'); gr.addColorStop(1, '#c43b14'); }
    else { gr.addColorStop(0, '#77abff'); gr.addColorStop(0.5, '#2a6ef0'); gr.addColorStop(1, '#1a55d8'); }
    g.fillStyle = gr; rrect(g, x, y, 21, 21, 3); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1; rrect(g, x + 0.5, y + 0.5, 20, 20, 3); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.lineCap = 'square';
    g.beginPath();
    if (red) { g.moveTo(x + 6, y + 6); g.lineTo(x + 15, y + 15); g.moveTo(x + 15, y + 6); g.lineTo(x + 6, y + 15); }
    else if (k === 'min') { g.moveTo(x + 6, y + 15); g.lineTo(x + 12, y + 15); }
    else { g.rect(x + 5.5, y + 5.5, 10, 10); g.moveTo(x + 5.5, y + 6.5); g.lineTo(x + 15.5, y + 6.5); }
    g.stroke(); g.lineCap = 'butt';
  }
  function xpFolderIcon(g, x, y, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const gr = g.createLinearGradient(0, 0, 0, 32);
    gr.addColorStop(0, '#ffe58a'); gr.addColorStop(1, '#e7b52e');
    g.fillStyle = '#d9a520'; rrect(g, 1, 4, 14, 6, 2); g.fill();
    g.fillStyle = gr; rrect(g, 1, 7, 30, 22, 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(2, 8, 28, 2);
    g.strokeStyle = 'rgba(150,100,0,0.6)'; g.lineWidth = 1; rrect(g, 1.5, 7.5, 29, 21, 2); g.stroke();
    g.restore();
  }
  function xpThumb(g, x, y, w, h, k) {
    const r = rng(k * 17 + 3);
    const sky = g.createLinearGradient(0, y, 0, y + h);
    const pal = [['#ff9a3c', '#ffd27a', '#5a2a5a'], ['#3a7bd5', '#b0d8ff', '#3f8f2a'], ['#1e5f74', '#9fe0c8', '#2a6a3a'], ['#c8d8ec', '#ffffff', '#8aa0b8'], ['#2a9de0', '#e8f6ff', '#e8c88a'], ['#e05a8a', '#ffd0e0', '#3a7a2a'], ['#0a1a40', '#40c090', '#081020'], ['#e8a050', '#ffe0a0', '#c07030']][k % 8];
    sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]);
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    g.fillStyle = pal[2];
    g.beginPath(); g.moveTo(x, y + h * (0.6 + r() * 0.2));
    for (let i = 1; i <= 6; i++) g.lineTo(x + (w * i) / 6, y + h * (0.5 + r() * 0.3));
    g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); g.fill();
    if (k === 0 || k === 7) { g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(x + w * 0.65, y + h * 0.45, h * 0.12, 0, TAU); g.fill(); }
  }
  function xpWindowCanvas() {
    const w = 640, h = 430, S = 2;
    const { c, g } = mk(w * S, h * S);
    g.scale(S, S);
    g.fillStyle = '#0a52de'; rrect(g, 0, 0, w, h, 8); g.fill();
    g.fillStyle = xpTitleGrad(g, 0, 30);
    g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 8); g.arcTo(0, 0, 8, 0, 8); g.lineTo(w - 8, 0); g.arcTo(w, 0, w, 8, 8); g.lineTo(w, 30); g.closePath(); g.fill();
    xpFolderIcon(g, 7, 6, 0.55);
    g.font = `700 14px ${FIRA}`; g.fillStyle = '#0a1e6e'; g.fillText('My Pictures', 29, 21); g.fillStyle = '#fff'; g.fillText('My Pictures', 28, 20);
    xpCapBtn(g, w - 74, 5, 'min'); xpCapBtn(g, w - 51, 5, 'max'); xpCapBtn(g, w - 27, 5, 'x');
    const bx = 4, by = 30, bw = w - 8, bh = h - 34;
    g.fillStyle = '#ece9d8'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#333';
    ['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].reduce((xx, s) => { tx(g, s, xx, by + 15, 11, ARI, 400, '#000'); return xx + g.measureText(s).width + 16; }, bx + 8);
    g.fillStyle = '#d4d0c4'; g.fillRect(bx, by + 21, bw, 1);
    // toolbar
    const back = g.createRadialGradient(bx + 20, by + 34, 2, bx + 22, by + 38, 13);
    back.addColorStop(0, '#9ef08a'); back.addColorStop(1, '#2a9a1e');
    g.fillStyle = back; g.beginPath(); g.arc(bx + 22, by + 38, 12, 0, TAU); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + 28, by + 38); g.lineTo(bx + 16, by + 38); g.moveTo(bx + 21, by + 32); g.lineTo(bx + 15, by + 38); g.lineTo(bx + 21, by + 44); g.stroke();
    tx(g, 'Back', bx + 40, by + 43, 11, ARI, 400, '#000');
    g.fillStyle = '#b8b8b8'; g.beginPath(); g.arc(bx + 92, by + 38, 12, 0, TAU); g.fill();
    xpFolderIcon(g, bx + 118, by + 26, 0.75);
    tx(g, 'Search', bx + 172, by + 43, 11, ARI, 400, '#000'); tx(g, 'Folders', bx + 228, by + 43, 11, ARI, 400, '#000');
    g.fillStyle = '#d4d0c4'; g.fillRect(bx, by + 55, bw, 1);
    tx(g, 'Address', bx + 8, by + 72, 11, ARI, 400, '#555');
    g.fillStyle = '#fff'; g.fillRect(bx + 56, by + 60, bw - 70, 18); g.strokeStyle = '#7f9db9'; g.strokeRect(bx + 56.5, by + 60.5, bw - 71, 17);
    xpFolderIcon(g, bx + 60, by + 62, 0.42);
    tx(g, 'C:\\Documents and Settings\\User\\My Pictures', bx + 80, by + 73, 11, ARI, 400, '#000');
    // left task pane
    const ly = by + 82, lh = bh - 82;
    const lp = g.createLinearGradient(0, ly, 0, ly + lh);
    lp.addColorStop(0, '#7ba2e7'); lp.addColorStop(1, '#6375d6');
    g.fillStyle = lp; g.fillRect(bx, ly, 190, lh);
    const panel = (py, title, items) => {
      const hg = g.createLinearGradient(bx + 12, 0, bx + 178, 0);
      hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#c6d3f7');
      g.fillStyle = hg; rrect(g, bx + 12, py, 166, 24, 4); g.fill();
      tx(g, title, bx + 22, py + 16, 11, ARI, 700, '#215dc6');
      g.fillStyle = '#d6dff7'; g.fillRect(bx + 12, py + 22, 166, items.length * 20 + 10);
      items.forEach((s, i) => { g.fillStyle = '#4a7ad8'; g.fillRect(bx + 22, py + 33 + i * 20, 10, 10); tx(g, s, bx + 38, py + 42 + i * 20, 11, ARI, 400, '#215dc6'); });
    };
    panel(ly + 12, 'Picture Tasks', ['View as a slide show', 'Order prints online', 'Print pictures']);
    panel(ly + 120, 'File and Folder Tasks', ['Make a new folder', 'Publish to the Web', 'Share this folder']);
    // content
    g.fillStyle = '#fff'; g.fillRect(bx + 190, ly, bw - 190, lh);
    const names = ['Sunset', 'Hills', 'Lagoon', 'Winter', 'Beach', 'Garden', 'Aurora', 'Dunes'];
    for (let i = 0; i < 8; i++) {
      const cx = bx + 210 + (i % 4) * 104, cy = ly + 18 + Math.floor(i / 4) * 128;
      g.fillStyle = '#fff'; g.fillRect(cx, cy, 90, 90); g.strokeStyle = '#d0d0d0'; g.lineWidth = 1; g.strokeRect(cx + 0.5, cy + 0.5, 89, 89);
      xpThumb(g, cx + 6, cy + 15, 78, 60, i);
      tx(g, names[i] + '.jpg', cx + 45, cy + 108, 11, ARI, 400, '#000', 'center');
    }
    return c;
  }
  function xpStartCanvas() {
    const w = 380, h = 470, S = 2;
    const { c, g } = mk(w * S, h * S);
    g.scale(S, S);
    g.fillStyle = '#1c5ad8'; rrect(g, 0, 0, w, h + 10, 8); g.fill();
    const hd = g.createLinearGradient(0, 0, 0, 64);
    hd.addColorStop(0, '#2f7bf0'); hd.addColorStop(0.5, '#1660e0'); hd.addColorStop(1, '#0e4fc8');
    g.fillStyle = hd; g.beginPath(); g.moveTo(0, 64); g.lineTo(0, 8); g.arcTo(0, 0, 8, 0, 8); g.lineTo(w - 8, 0); g.arcTo(w, 0, w, 8, 8); g.lineTo(w, 64); g.closePath(); g.fill();
    // user picture: a stylised flower tile
    g.fillStyle = '#fff'; rrect(g, 8, 8, 48, 48, 5); g.fill();
    const up = g.createLinearGradient(0, 11, 0, 53); up.addColorStop(0, '#7ad0ff'); up.addColorStop(1, '#2a8a3a');
    g.fillStyle = up; rrect(g, 11, 11, 42, 42, 3); g.fill();
    for (let k = 0; k < 6; k++) { g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(32 + Math.cos(k * TAU / 6) * 8, 30 + Math.sin(k * TAU / 6) * 8, 6, 4, k * TAU / 6, 0, TAU); g.fill(); }
    g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(32, 30, 5, 0, TAU); g.fill();
    g.font = `700 17px ${FIRA}`; g.fillStyle = '#0a2a80'; g.fillText('User', 69, 41); g.fillStyle = '#fff'; g.fillText('User', 68, 40);
    const og = g.createLinearGradient(0, 0, w, 0); og.addColorStop(0, 'rgba(255,160,60,0)'); og.addColorStop(0.5, '#ff9c38'); og.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = og; g.fillRect(0, 64, w, 2);
    g.fillStyle = '#fff'; g.fillRect(2, 66, 188, h - 66 - 40);
    g.fillStyle = '#d3e5fa'; g.fillRect(190, 66, w - 192, h - 66 - 40);
    g.fillStyle = '#a8c4ea'; g.fillRect(190, 66, 1, h - 106);
    const left = [['Internet', 'Web Browser', '#2a7ad8'], ['E-mail', 'Mail Client', '#3aa04a'], ['Paint', '', '#e0602a'], ['Media Player', '', '#e8a020'], ['Solitaire', '', '#2050c0'], ['Command Prompt', '', '#222']];
    left.forEach(([a, b], i) => {
      const y = 76 + i * 40 + (i > 1 ? 8 : 0);
      g.fillStyle = left[i][2]; rrect(g, 10, y + 2, 28, 28, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; rrect(g, 12, y + 4, 24, 11, 5); g.fill();
      tx(g, a, 46, y + (b ? 15 : 21), 12, ARI, i < 2 ? 700 : 400, '#000');
      if (b) tx(g, b, 46, y + 29, 11, ARI, 400, '#7a7a7a');
      if (i === 1) { g.fillStyle = '#d0d0d0'; g.fillRect(10, y + 40, 170, 1); }
    });
    g.fillStyle = '#d0d0d0'; g.fillRect(10, h - 78, 170, 1);
    tx(g, 'All Programs', 52, h - 54, 13, ARI, 700, '#000');
    g.fillStyle = '#2aa02a'; g.beginPath(); g.moveTo(150, h - 66); g.lineTo(166, h - 58); g.lineTo(150, h - 50); g.fill();
    ['My Documents', 'My Pictures', 'My Music', 'My Computer', '-', 'Control Panel', 'Printers and Faxes', '-', 'Help and Support', 'Search', 'Run...'].reduce((y, s) => {
      if (s === '-') { g.fillStyle = '#a8c4ea'; g.fillRect(200, y + 4, 170, 1); return y + 10; }
      xpFolderIcon(g, 198, y + 2, 0.7);
      tx(g, s, 226, y + 17, 12, ARI, s.startsWith('My') ? 700 : 400, '#0a246a');
      return y + 30;
    }, 74);
    // bottom bar
    const bb = g.createLinearGradient(0, h - 40, 0, h);
    bb.addColorStop(0, '#2f73e8'); bb.addColorStop(1, '#1050c8');
    g.fillStyle = bb; g.fillRect(0, h - 40, w, 40);
    g.fillStyle = '#f0b030'; rrect(g, 172, h - 32, 22, 22, 4); g.fill();
    tx(g, 'Log Off', 200, h - 15, 12, ARI, 400, '#fff');
    g.fillStyle = '#e04a2a'; rrect(g, 262, h - 32, 22, 22, 4); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(273, h - 20, 6, -Math.PI * 0.3, Math.PI * 1.3); g.moveTo(273, h - 29); g.lineTo(273, h - 21); g.stroke();
    tx(g, 'Turn Off Computer', 290, h - 15, 12, ARI, 400, '#fff');
    return c;
  }
  function xpDialogCanvas() {
    const w = 330, h = 210, S = 2;
    const { c, g } = mk(w * S, h * S);
    g.scale(S, S);
    g.fillStyle = '#00309c'; g.fillRect(0, 0, w, 48);
    tx(g, 'Turn off computer', 14, 31, 17, FIRA, 400, '#fff');
    const mg = g.createLinearGradient(0, 48, w, 160); mg.addColorStop(0, '#7a9ff0'); mg.addColorStop(1, '#4f73d6');
    g.fillStyle = mg; g.fillRect(0, 48, w, 112);
    const l1 = g.createLinearGradient(0, 0, w, 0); l1.addColorStop(0, 'rgba(255,255,255,0)'); l1.addColorStop(0.3, '#fff'); l1.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = l1; g.fillRect(0, 48, w, 1.5);
    g.fillStyle = '#00309c'; g.fillRect(0, 160, w, 50);
    const btns = [['Stand By', '#f2a51e', '#c77a06'], ['Turn Off', '#e8582e', '#b8300e'], ['Restart', '#3cb03c', '#1f7d1f']];
    btns.forEach(([s, a, b], i) => {
      const cx = 65 + i * 100, cy = 92;
      const gr = g.createLinearGradient(0, cy - 17, 0, cy + 17); gr.addColorStop(0, a); gr.addColorStop(1, b);
      g.fillStyle = gr; rrect(g, cx - 17, cy - 17, 34, 34, 5); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.5; rrect(g, cx - 16.5, cy - 16.5, 33, 33, 5); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.35)'; rrect(g, cx - 15, cy - 15, 30, 13, 4); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath();
      if (i === 0) { g.arc(cx, cy, 8, Math.PI * 0.6, Math.PI * 1.9); }
      else if (i === 1) { g.arc(cx, cy + 1, 8, -Math.PI * 0.3, Math.PI * 1.3); g.moveTo(cx, cy - 10); g.lineTo(cx, cy); }
      else { g.arc(cx, cy, 8, Math.PI * 0.1, Math.PI * 1.6); g.moveTo(cx + 2, cy - 10); g.lineTo(cx + 7, cy - 6); g.lineTo(cx + 2, cy - 2); }
      g.stroke();
      tx(g, s, cx, cy + 36, 12, ARI, 400, '#fff', 'center');
    });
    g.fillStyle = '#fff'; rrect(g, w - 86, 172, 72, 24, 3); g.fill();
    g.strokeStyle = '#1c3a8a'; rrect(g, w - 85.5, 172.5, 71, 23, 3); g.stroke();
    tx(g, 'Cancel', w - 50, 188, 12, ARI, 400, '#000', 'center');
    return c;
  }
  function xpCursor(g, x, y) {
    g.save(); g.translate(x, y);
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 3; g.shadowOffsetX = 1.5; g.shadowOffsetY = 1.5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 17); g.lineTo(4, 13.2); g.lineTo(7, 19.5); g.lineTo(9.6, 18.3); g.lineTo(6.8, 12.2); g.lineTo(12, 12.2); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = '#000'; g.lineWidth = 1; g.lineJoin = 'round'; g.stroke();
    g.restore();
  }
  const XP_CUR = [[DK.winOpen, 760, 420], [DK.grabXP - 0.02, 360, 118, E.ioC], [DK.grabXP + 0.03, 360, 118], [DK.dropXP, 560, 98, E.ioC], [DK.startXP - 0.03, 46, 706, E.ioC], [DK.startXP + 0.05, 46, 706], [DK.turnOff - 0.03, 300, 676, E.ioC], [DK.turnOff + 0.05, 300, 676], [DK.red - 0.04, 640, 356, E.ioC], [9, 640, 356]];
  const xpCurAt = t => path2(t, XP_CUR);

  function drawXP(c, t, st) {
    // c is already scaled to 1280×720 space
    const gray = E.ioS(seg(t, DK.turnOff + 0.02, DK.turnOff + 0.45));
    if (gray > 0) c.filter = `grayscale(${gray.toFixed(3)}) brightness(${(1 - gray * 0.12).toFixed(3)})`;
    c.drawImage(st.xpWall, 0, 0, 1280, 720);
    // desktop icons
    const icon = (x, y, s, kind) => {
      if (kind === 'folder') xpFolderIcon(c, x - 16, y, 1.1);
      else if (kind === 'bin') {
        const gr = c.createLinearGradient(x - 14, 0, x + 14, 0); gr.addColorStop(0, '#d8e4f0'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#9fb4cc');
        c.fillStyle = gr; c.beginPath(); c.moveTo(x - 14, y + 6); c.lineTo(x + 14, y + 6); c.lineTo(x + 11, y + 34); c.lineTo(x - 11, y + 34); c.closePath(); c.fill();
        c.strokeStyle = '#6a8098'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#3aa03a'; c.beginPath(); c.arc(x, y + 20, 6, 0, TAU); c.fill();
      } else {
        c.fillStyle = '#e8e8e0'; rrect(c, x - 16, y + 2, 32, 24, 2); c.fill(); c.fillStyle = '#2a6ad8'; c.fillRect(x - 13, y + 5, 26, 18);
        c.fillStyle = '#d0d0c8'; c.fillRect(x - 8, y + 27, 16, 4); c.fillRect(x - 12, y + 31, 24, 3);
      }
      c.font = `400 12px ${ARI}`; c.textAlign = 'center';
      c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillText(s, x + 1, y + 52);
      c.fillStyle = '#fff'; c.fillText(s, x, y + 51);
    };
    icon(48, 30, 'My Computer', 'pc'); icon(48, 120, 'My Pictures', 'folder'); icon(1220, 590, 'Recycle Bin', 'bin');
    // window: zoom rect then open, then dragged
    const open = seg(t, DK.winOpen, DK.winOpen + 0.14);
    if (t >= DK.winOpen && open < 1) {
      for (let k = 0; k < 4; k++) {
        const p = E.outC(clamp(open * 1.3 - k * 0.1));
        if (p <= 0) continue;
        c.strokeStyle = `rgba(255,255,255,${0.8 - k * 0.15})`; c.lineWidth = 1.5;
        c.strokeRect(lerp(32, 170, p), lerp(120, 100, p), lerp(32, 640, p), lerp(32, 430, p));
      }
    }
    const cur = xpCurAt(t);
    if (open >= 1) {
      const dx = t < DK.grabXP ? 0 : t < DK.dropXP ? cur[0] - 360 : 200, dy = t < DK.grabXP ? 0 : t < DK.dropXP ? cur[1] - 118 : -20;
      const wx = 170 + dx, wy = 100 + dy;
      c.save(); c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
      c.drawImage(st.xpWin, wx, wy, 640, 430); c.restore();
    }
    // taskbar
    const ty = 690;
    const tg = c.createLinearGradient(0, ty, 0, 720);
    tg.addColorStop(0, '#3c81f3'); tg.addColorStop(0.1, '#245edb'); tg.addColorStop(0.5, '#2457d5'); tg.addColorStop(0.92, '#1f4fc4'); tg.addColorStop(1, '#173fa8');
    c.fillStyle = tg; c.fillRect(0, ty, 1280, 30);
    const sg = c.createLinearGradient(0, ty, 0, 720);
    const startDown = t >= DK.startXP && t < DK.turnOff + 0.05;
    sg.addColorStop(0, startDown ? '#2c7a2c' : '#4fae4f'); sg.addColorStop(0.5, startDown ? '#246a24' : '#36993a'); sg.addColorStop(1, startDown ? '#1e5a1e' : '#2a7d2e');
    c.fillStyle = sg; c.beginPath(); c.moveTo(0, ty); c.lineTo(88, ty); c.quadraticCurveTo(102, ty, 102, ty + 15); c.quadraticCurveTo(102, 720, 88, 720); c.lineTo(0, 720); c.closePath(); c.fill();
    c.font = `italic 800 19px ${FIRA}`; c.textAlign = 'left';
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillText('start', 35, ty + 22); c.fillStyle = '#fff'; c.fillText('start', 34, ty + 21);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(19, ty + 15, 8, 0, TAU); c.fill();
    c.fillStyle = '#36993a'; c.beginPath(); c.moveTo(16, ty + 10); c.lineTo(24, ty + 15); c.lineTo(16, ty + 20); c.fill();
    if (open >= 1) {
      c.fillStyle = '#1e48b8'; rrect(c, 110, ty + 3, 170, 24, 3); c.fill();
      xpFolderIcon(c, 116, ty + 6, 0.55);
      tx(c, 'My Pictures', 138, ty + 20, 12, ARI, 400, '#fff');
    }
    const trg = c.createLinearGradient(0, ty, 0, 720); trg.addColorStop(0, '#1bacf2'); trg.addColorStop(0.5, '#0f8fe0'); trg.addColorStop(1, '#0b77c8');
    c.fillStyle = trg; c.fillRect(1150, ty, 130, 30); c.fillStyle = '#0a5ab0'; c.fillRect(1150, ty, 1, 30);
    tx(c, '10:24 AM', 1268, ty + 20, 12, ARI, 400, '#fff', 'right');
    c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(1170, ty + 15, 6, 0, TAU); c.fill();
    c.fillStyle = '#e8f0ff'; c.fillRect(1184, ty + 9, 12, 12);
    // balloon
    const bl = bump(t, DK.balloon, 0.15, 0.4, 0.15);
    if (bl > 0 && t < DK.startXP + 0.1) {
      c.save(); c.globalAlpha = bl;
      c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
      c.fillStyle = '#ffffe1'; rrect(c, 930, 600, 300, 66, 8); c.fill();
      c.beginPath(); c.moveTo(1150, 664); c.lineTo(1172, 690); c.lineTo(1176, 664); c.fill();
      c.shadowColor = 'transparent'; c.strokeStyle = '#555'; c.lineWidth = 1; rrect(c, 930.5, 600.5, 299, 65, 8); c.stroke();
      c.fillStyle = '#2a6ad8'; c.beginPath(); c.arc(950, 620, 9, 0, TAU); c.fill();
      tx(c, 'i', 950, 625, 13, TIN, 700, '#fff', 'center', 'italic');
      tx(c, 'Your computer is ready', 966, 625, 12, ARI, 700, '#000');
      tx(c, 'New hardware installed: 32-bit colour, 1280 x 720.', 944, 648, 11, ARI, 400, '#000');
      c.restore();
    }
    // start menu
    if (t >= DK.startXP && t < DK.turnOff + 0.06) {
      const p = E.outC(seg(t, DK.startXP, DK.startXP + 0.1));
      c.save(); c.beginPath(); c.rect(0, 220, 400, 470); c.clip();
      c.globalAlpha = p;
      c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 12; c.shadowOffsetX = 3;
      c.drawImage(st.xpStart, 0, 220 + (1 - p) * 60, 380, 470);
      c.restore();
    }
    c.filter = 'none';
    // dialog
    if (t >= DK.turnOff + 0.06) {
      const p = E.outC(seg(t, DK.turnOff + 0.06, DK.turnOff + 0.2));
      c.save(); c.globalAlpha = p;
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 20; c.shadowOffsetY = 6;
      c.drawImage(st.xpDlg, 475, 250, 330, 210);
      c.restore();
      if (t >= DK.red) { c.fillStyle = 'rgba(0,0,0,0.25)'; rrect(c, 623, 325, 34, 34, 5); c.fill(); }
      else if (Math.hypot(cur[0] - 640, cur[1] - 342) < 30) { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2; rrect(c, 621, 323, 38, 38, 7); c.stroke(); }
    }
    if (t >= DK.winOpen - 0.02) xpCursor(c, cur[0], cur[1]);
  }

  MG.film({
    id: 'desktop', dur: 10, poster: 6.3,
    fonts: [['600 13px "Pixelify Sans"', 'A'], ['400 11px Arimo', 'A'], ['700 11px Arimo', 'A'], ['italic 800 19px "Fira Sans"', 'a'], ['700 14px "Fira Sans"', 'A']],
    meta: {
      family: 'G', name: 'Retro Desktop UI', sub: 'Windows, Icons, Menus, Pointer', era: '1984 — 2001',
      origin: 'The graphical desktop metaphor born at Xerox PARC (Alto, 1973; Star, 1981) reached the public with the 1-bit Apple Macintosh in 1984, became mass culture with Windows 95’s Start button and taskbar, and peaked in the glossy Luna theme of Windows XP in 2001.',
      works: 'Xerox Star 8010 (1981) · Apple Macintosh System 1, icons by Susan Kare (1984) · Windows 95 (1995) · Microsoft Solitaire win cascade, Wes Cherry (1990) · Windows XP Luna (2001)',
      tech: ['Pixel-exact bevels & 1-bit dither', 'Zoom-rect window opening', 'Cursor-driven choreography'],
      accent: '#2a6ad8',
      motionDNA: 'The cursor is the protagonist: every move is a double-click, drag or menu pull answered by zoom rectangles, inverted highlights and a progress bar.',
      visualDNA: 'Native-resolution pixels scaled up crisp: 1-bit checker gray and striped title bars, teal desktop with grey 3D bevels and navy captions, then Luna blue glass, green Start and rolling-hill wallpaper.',
      transitions: 'Zoom-rect open, dithered dissolve, caption-bar zoom, Solitaire trail cascade, display mode-switch blackout, grayscale shut-down fade, CRT collapse',
      implementation: ['Canvas 2D', 'Pixel art', 'After Effects'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const pc = offscreen(2, 2), pg = pc.getContext('2d');
      pg.fillStyle = '#fff'; pg.fillRect(0, 0, 2, 2); pg.fillStyle = '#000'; pg.fillRect(0, 0, 1, 1); pg.fillRect(1, 1, 1, 1);
      const mac = mk(640, 360), w95 = mk(960, 540), big = mk(1920, 1080), mask = mk(320, 180), fin = mk(480, 270);
      const st = { mac, w95, big, mask, fin, casc: buildCascade(), cards: new Map() };
      st.macPat = mac.g.createPattern(pc, 'repeat');
      st.card = (r, s) => { const k = r * 4 + s; if (!st.cards.has(k)) st.cards.set(k, cardCanvas(r, s)); return st.cards.get(k); };
      return st;
    },
    draw(ctx, t, W, H, st) {
      if (!st.back) { st.back = cardBack(); st.xpWall = xpWallpaper(); st.xpWel = xpWelcome(); st.xpWin = xpWindowCanvas(); st.xpStart = xpStartCanvas(); st.xpDlg = xpDialogCanvas(); }
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      // camera
      const z = kf(t, [[0, 1.04], [0.5, 1], [0.9, 1], [1.4, 1.1], [1.9, 1.1], [2.15, 1.1], [2.5, 1.1], [2.75, 1.18], [3.05, 1.2], [3.4, 1.22], [3.52, 1.3], [3.9, 1.3], [4.1, 1.42], [4.45, 1.46], [4.62, 1.38], [5.0, 1.42], [5.16, 1], [6.5, 1.07], [6.6, 1], [7.4, 1], [8.05, 1.04], [8.3, 1.12], [8.42, 1.12], [8.6, 1.18], [8.75, 1.2], [9, 1]]);
      const fx = kf(t, [[0, 960], [1.4, 900], [1.9, 1300], [2.15, 420], [2.5, 420], [2.75, 960], [3.05, 960], [3.4, 140], [3.52, 120], [3.9, 940], [4.1, 960], [4.45, 960], [4.62, 0], [5.0, 0], [5.16, 960], [7.4, 960], [8.05, 900], [8.3, 0], [8.42, 0], [8.6, 960], [9, 960]]);
      const fy = kf(t, [[0, 540], [1.4, 470], [1.9, 760], [2.15, 120], [2.5, 120], [2.75, 560], [3.05, 560], [3.4, 360], [3.52, 360], [3.9, 420], [4.1, 500], [4.45, 500], [4.62, 1080], [5.0, 1080], [5.16, 540], [7.4, 540], [8.05, 600], [8.3, 1080], [8.42, 1080], [8.6, 530], [9, 540]]);
      const cam = (g) => { g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy); };
      const blitLow = (src, bloom) => {
        st.big.g.imageSmoothingEnabled = false;
        st.big.g.drawImage(src, 0, 0, 1920, 1080);
        ctx.save(); cam(ctx); ctx.imageSmoothingEnabled = true; ctx.drawImage(st.big.c, 0, 0);
        if (bloom) { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = bloom; ctx.filter = 'blur(7px)'; ctx.drawImage(st.big.c, 0, 0); }
        ctx.restore();
      };
      const scan = (a, step) => { ctx.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, step / 2); };
      if (t < DK.dissB) {
        const g = st.mac.g;
        drawMac(g, t, st);
        // 1-bit threshold with phosphor tint
        if (t >= DK.on) {
          const d = g.getImageData(0, 0, 640, 360), a = d.data;
          const warm = clamp((t - DK.on) / 0.12);
          const wr = Math.round(226 * warm), wg = Math.round(232 * warm), wb = Math.round(238 * warm);
          for (let i = 0; i < a.length; i += 4) {
            const on = a[i] + a[i + 1] + a[i + 2] > 382;
            a[i] = on ? wr : 14; a[i + 1] = on ? wg : 14; a[i + 2] = on ? wb : 18; a[i + 3] = 255;
          }
          g.putImageData(d, 0, 0);
        }
        blitLow(st.mac.c, 0.28);
        scan(0.22, 3);
      }
      if (t >= DK.dissA && t < DK.black) {
        drawW95(st.w95.g, t, st);
        if (t < DK.dissB) {
          // dithered block dissolve
          const p = seg(t, DK.dissA, DK.dissB), mg = st.mask.g, md = mg.createImageData(320, 180), a = md.data;
          for (let j = 0; j < 180; j++) for (let i = 0; i < 320; i++) {
            const v = hash(i * 0.913 + j * 71.37) * 0.75 + (1 - j / 180) * 0.25;
            a[(j * 320 + i) * 4 + 3] = v < p ? 255 : 0;
          }
          mg.putImageData(md, 0, 0);
          const bg = st.big.g;
          bg.save(); bg.imageSmoothingEnabled = false;
          bg.drawImage(st.w95.c, 0, 0, 1920, 1080);
          bg.globalCompositeOperation = 'destination-in';
          bg.drawImage(st.mask.c, 0, 0, 1920, 1080);
          bg.restore();
          ctx.save(); cam(ctx); ctx.drawImage(st.big.c, 0, 0); ctx.restore();
        } else blitLow(st.w95.c, 0.1);
        scan(0.1, 2);
      }
      if (t >= DK.black && t < DK.welcome) {
        // display mode switch: blank + OSD
        if (t > DK.black + 0.05) {
          ctx.font = `600 26px ${MONO}`; ctx.textAlign = 'right'; ctx.fillStyle = '#3aff6a';
          ctx.fillText('1280 x 720   32-BIT   75 Hz', W - 70, 90);
        }
      }
      if (t >= DK.welcome && t < DK.final) {
        ctx.save();
        const coll = seg(t, DK.crt, DK.crt + 0.2);
        if (coll > 0) {
          const sy = Math.max(0.004, 1 - E.inC(Math.min(1, coll * 2.4)));
          const sx = coll < 0.62 ? 1 : Math.max(0.002, 1 - E.inQ(seg(coll, 0.62, 1)));
          ctx.translate(W / 2, H / 2); ctx.scale(sx, sy); ctx.translate(-W / 2, -H / 2);
        }
        cam(ctx); ctx.scale(1.5, 1.5);
        if (t >= DK.desk) drawXP(ctx, t, st);
        if (coll > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${Math.min(1, coll * 1.5).toFixed(3)})`; ctx.fillRect(0, 0, 1280, 720); ctx.globalCompositeOperation = 'source-over'; }
        const wf = 1 - seg(t, DK.desk, DK.desk + 0.22);
        if (wf > 0) {
          ctx.globalAlpha = wf;
          ctx.drawImage(st.xpWel, 0, 0, 1280, 720);
          const wp = E.outC(seg(t, DK.welcome + 0.08, DK.welcome + 0.5));
          ctx.globalAlpha = wf * wp;
          ctx.font = `italic 700 92px ${FIRA}`; ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(10,30,110,0.5)'; ctx.fillText('welcome', 676 + 4 - (1 - wp) * 30, 392 + 4);
          ctx.fillStyle = '#fff'; ctx.fillText('welcome', 676 - (1 - wp) * 30, 392);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        if (coll > 0.5) { const d = 1 - seg(coll, 0.85, 1); ctx.fillStyle = `rgba(255,255,255,${d})`; ctx.beginPath(); ctx.arc(W / 2, H / 2, 6 + d * 4, 0, TAU); ctx.fill(); }
      }
      if (t >= DK.final) {
        const g = st.fin.g;
        g.fillStyle = '#000'; g.fillRect(0, 0, 480, 270);
        bt(g, 'It\u2019s now safe to turn off', 240, 128, { size: 21, weight: 700, color: '#ff9a10', align: 'center', th: 120 });
        bt(g, 'your computer.', 240, 158, { size: 21, weight: 700, color: '#ff9a10', align: 'center', th: 120 });
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = 'rgba(255,140,20,0.55)'; ctx.shadowBlur = 26;
        ctx.drawImage(st.fin.c, 0, 0, 1920, 1080);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
      }
      grain(ctx, W, H, t, 0.035);
      vignette(ctx, W, H, t >= DK.final ? 0.6 : 0.22);
    },
    score(A) {
      const click = (t, g = 0.16) => { A.noise(t, { type: 'highpass', f: 2500, dur: 0.012, g }); A.osc(t, { f: 1900, dur: 0.012, g: g * 0.25 }); A.noise(t + 0.045, { type: 'highpass', f: 3500, dur: 0.008, g: g * 0.6 }); };
      // 1984 — startup chime: a big C major chord
      A.osc(0.02, { f: 60, dur: 0.25, g: 0.12 });
      A.chord(DK.chime, [48, 55, 60, 64, 67, 72], { type: 'sawtooth', dur: 2.1, g: 0.022, a: 0.008, lp: 3200, lp2: 500, lpT: 2.0, spread: 5, rev: 0.45, width: 1.2 });
      A.chord(DK.chime, [36, 48, 60, 64, 67], { type: 'triangle', dur: 2.2, g: 0.05, a: 0.008, rev: 0.4 });
      A.noise(DK.on, { type: 'highpass', f: 6000, dur: 3, g: 0.008, hold: true, rel: 0.2 });
      A.noise(DK.menubar, { type: 'highpass', f: 4000, dur: 0.01, g: 0.06 });
      click(DK.dbl1); click(DK.dbl2);
      for (let k = 0; k < 6; k++) A.osc(DK.zoomA + k * 0.035, { type: 'square', f: 600 + k * 180, dur: 0.02, g: 0.025, lp: 4000 });
      for (let k = 0; k < 5; k++) A.noise(DK.zoomB + k * 0.06, { type: 'bandpass', f: 500, q: 2, dur: 0.05, g: 0.07 });
      click(DK.grab, 0.12); click(DK.drop, 0.12);
      for (let k = 0; k < 6; k++) A.noise(DK.drop + 0.04 + k * 0.035 + hash(k) * 0.02, { type: 'bandpass', f: 1500 + hash(k + 3) * 2500, q: 1.5, dur: 0.03, g: 0.08 });
      click(DK.menuDown, 0.1); click(DK.menuUp, 0.1);
      A.osc(DK.alert, { type: 'square', f: midi(81), dur: 0.22, g: 0.05, lp: 2500 });
      A.osc(DK.alert + 0.11, { type: 'square', f: midi(76), dur: 0.25, g: 0.04, lp: 2500 });
      click(DK.ok);
      // dissolve: bit-crushed rising arpeggio
      for (let k = 0; k < 14; k++) A.osc(DK.dissA + k * 0.024, { type: 'square', f: midi(60 + [0, 4, 7, 12][k % 4] + Math.floor(k / 4) * 12 / 2), dur: 0.03, g: 0.025, crush: true });
      A.noise(DK.dissA, { type: 'bandpass', f: 600, f2: 7000, q: 1.5, dur: 0.36, g: 0.07, swell: 0.8 });
      // 1995 — lush startup swell
      A.chord(DK.w95, [51, 58, 63, 67, 70, 74], { type: 'sawtooth', dur: 2.3, g: 0.016, a: 0.25, hold: true, rel: 1.4, lp: 1800, spread: 9, rev: 0.7, width: 1.4 });
      A.osc(DK.w95, { f: midi(39), dur: 2.0, g: 0.12, a: 0.1 });
      [75, 82, 79, 86, 87].forEach((m, i) => A.bell(DK.w95 + 0.12 + i * 0.11, midi(m), { g: 0.03, dur: 1.6, rev: 0.7, pan: (i / 4 - 0.5) }));
      click(DK.grab95, 0.12); click(DK.drop95, 0.12);
      // floppy drive grind and seek
      for (let k = 0; k < 9; k++) {
        const tt = DK.copyA + 0.04 + k * 0.055;
        A.noise(tt, { type: 'bandpass', f: 320 + (k % 3) * 70, q: 3, dur: 0.045, g: 0.12 });
        A.osc(tt, { type: 'square', f: 70 + (k % 2) * 20, dur: 0.04, g: 0.03, lp: 500 });
      }
      A.noise(DK.copyA, { type: 'bandpass', f: 180, q: 1, dur: 0.5, g: 0.05, hold: true, rel: 0.05 });
      A.bell(DK.copyB - 0.03, midi(84), { g: 0.04, dur: 0.5, ratios: [1, 2] }); A.bell(DK.copyB + 0.07, midi(79), { g: 0.035, dur: 0.6, ratios: [1, 2] });
      click(DK.start); A.noise(DK.start + 0.02, { type: 'bandpass', f: 2000, q: 2, dur: 0.06, g: 0.03 });
      A.noise(DK.prog, { type: 'highpass', f: 5000, dur: 0.01, g: 0.04 });
      click(DK.sol);
      A.whoosh(DK.sol, 0.16, { f1: 800, f2: 4000, g: 0.06 });
      // the win: a fanfare and a pluck on every bounce
      A.chord(DK.casc, [60, 64, 67], { type: 'sawtooth', dur: 0.14, g: 0.03, lp: 3000, rev: 0.3 });
      A.chord(DK.casc + 0.15, [65, 69, 72], { type: 'sawtooth', dur: 0.14, g: 0.03, lp: 3000, rev: 0.3 });
      A.chord(DK.casc + 0.3, [67, 71, 74, 79], { type: 'sawtooth', dur: 1.3, g: 0.025, a: 0.01, lp: 3600, lp2: 900, rev: 0.5, spread: 7, width: 1 });
      const penta = [0, 2, 4, 7, 9];
      buildCascade().forEach((c, n) => {
        A.noise(c.t0, { type: 'highpass', f: 3000, dur: 0.02, g: 0.04, pan: (c.pile / 3 - 0.5) });
        c.bounces.slice(0, 4).forEach((bt0, b) => {
          if (bt0 > DK.black - 0.05) return;
          const m = 72 + penta[(n + b * 2) % 5] + (b === 0 ? 0 : -12 * (b % 2));
          A.pluck(bt0, midi(m), { g: 0.11 / (1 + b * 0.6), dur: 0.6, bright: 0.6, rev: 0.25, pan: (c.pts[0][0] / 960 - 0.5) });
        });
      });
      // mode switch relay click
      A.noise(DK.black, { type: 'highpass', f: 1500, dur: 0.02, g: 0.12 }); A.osc(DK.black, { f: 120, f2: 40, dur: 0.08, g: 0.12 });
      A.osc(DK.black + 0.03, { f: 15600, dur: 0.12, g: 0.004 });
      // 2001 — bright startup
      A.chord(DK.welcome + 0.04, [51, 58, 63, 67, 70], { type: 'triangle', dur: 2.0, g: 0.04, a: 0.18, hold: true, rel: 0.9, rev: 0.6, width: 1.2 });
      A.chord(DK.welcome + 0.04, [63, 70, 75], { type: 'sawtooth', dur: 1.6, g: 0.012, a: 0.3, hold: true, rel: 0.8, lp: 2600, spread: 8, rev: 0.6 });
      [[0, 75], [0.16, 70], [0.32, 75], [0.5, 82], [0.62, 87]].forEach(([d, m], i) => A.bell(DK.welcome + 0.06 + d, midi(m), { g: 0.04, dur: 1.4, rev: 0.6, ratios: [1, 2.01, 3], pan: (i / 4 - 0.5) * 0.8 }));
      A.osc(DK.welcome + 0.04, { f: midi(39), dur: 1.6, g: 0.1, a: 0.08 });
      A.whoosh(DK.winOpen, 0.18, { f1: 1000, f2: 5000, g: 0.05 });
      click(DK.grabXP, 0.1); click(DK.dropXP, 0.1);
      A.osc(DK.balloon, { f: midi(84), dur: 0.12, g: 0.04 }); A.osc(DK.balloon + 0.08, { f: midi(91), dur: 0.3, g: 0.04, rev: 0.3 });
      click(DK.startXP); A.whoosh(DK.startXP, 0.12, { f1: 1500, f2: 4000, g: 0.03 });
      click(DK.turnOff);
      A.noise(DK.turnOff + 0.06, { type: 'lowpass', f: 2000, f2: 300, dur: 0.5, g: 0.04 });
      click(DK.red);
      // shut-down: descending motif
      [[0, 80], [0.17, 75], [0.34, 68], [0.5, 70]].forEach(([d, m]) => A.bell(DK.red + 0.06 + d, midi(m), { g: 0.04, dur: 1.2, rev: 0.6, ratios: [1, 2.01, 3] }));
      A.chord(DK.red + 0.06, [44, 51, 56, 63], { type: 'triangle', dur: 1.3, g: 0.035, a: 0.05, rev: 0.6 });
      // CRT off: thump + falling whine
      A.osc(DK.crt + 0.05, { f: 80, f2: 30, dur: 0.4, g: 0.25 });
      A.noise(DK.crt + 0.05, { type: 'lowpass', f: 1200, f2: 100, dur: 0.35, g: 0.1 });
      A.osc(DK.crt, { f: 9000, f2: 2000, glide: 0.3, dur: 0.35, g: 0.006 });
      for (let k = 0; k < 6; k++) A.noise(DK.crt + 0.1 + hash(k) * 0.3, { type: 'highpass', f: 4000, dur: 0.006, g: 0.05 });
      // final room tone
      A.noise(DK.final, { type: 'lowpass', f: 300, dur: 0.95, g: 0.02, hold: true, rel: 0.4 });
    },
  });

  /* =====================================================================
     G · WEBCORE — a 1997 personal homepage, loaded over dial-up
     ===================================================================== */
  const WB = { dial: 0.06, answer: 0.8, hand: 0.95, conn: 1.28, load: 1.32, music: 1.62, done: 2.3,
    click: 5.3, pop0: 5.4, popRate: 2.3, nPop: 36, implode: 7.66, flash: 7.86, lock: 7.9 };
  const WB_BEAT = 60 / 140;
  const hsl = (h, s = 100, l = 55) => `hsl(${((h % 360) + 360) % 360},${s}%,${l}%)`;
  const popT = i => WB.pop0 + Math.log2(i + 1) / WB.popRate;
  function sparkle(g, x, y, r, col) {
    g.fillStyle = col; g.beginPath();
    g.moveTo(x, y - r); g.lineTo(x + r * 0.22, y - r * 0.22); g.lineTo(x + r, y); g.lineTo(x + r * 0.22, y + r * 0.22);
    g.lineTo(x, y + r); g.lineTo(x - r * 0.22, y + r * 0.22); g.lineTo(x - r, y); g.lineTo(x - r * 0.22, y - r * 0.22); g.closePath(); g.fill();
  }
  function starTile(seed, n) {
    const { c, g } = mk(128, 128), r = rng(seed);
    g.fillStyle = '#000010'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(r() * 128), y = Math.floor(r() * 128), b = r();
      g.fillStyle = b > 0.9 ? '#ffff80' : b > 0.8 ? '#80c0ff' : `rgb(${150 + b * 105 | 0},${150 + b * 105 | 0},${170 + b * 85 | 0})`;
      g.fillRect(x, y, 1, 1);
      if (b > 0.93) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    }
    return c;
  }
  function swirlTile() {
    const { c, g } = mk(32, 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const v = Math.sin((x + y) * 0.39) * 0.5 + Math.sin((x - y) * 0.2 + 1) * 0.5;
      g.fillStyle = `rgb(${40 + v * 30 | 0},${10 + v * 10 | 0},${100 + v * 50 | 0})`; g.fillRect(x, y, 1, 1);
    }
    return c;
  }
  function wordArt(g, s, cx, y, size, t, o = {}) {
    const fam = o.font || BLACK, depth = o.depth ?? Math.round(size * 0.12), amp = o.amp ?? size * 0.12;
    g.font = `400 ${size}px ${fam}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const ws = [...s].map(ch => g.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0) + (o.track || 0) * (s.length - 1);
    let x = cx - tw / 2;
    const L = [];
    [...s].forEach((ch, i) => {
      const u = s.length > 1 ? i / (s.length - 1) : 0;
      const yy = y - Math.sin(u * Math.PI) * (o.arch || 0) + Math.sin(i * 0.55 - t * 4) * amp * 0.25;
      const drop = o.drop ? o.drop(i) : 0;
      L.push({ ch, x: x + ws[i] / 2, y: yy + drop, rot: (o.archRot ? (u - 0.5) * o.archRot : 0) + Math.cos(i * 0.55 - t * 4) * 0.03, sc: o.scale ? o.scale(i) : 1, a: o.alpha ? o.alpha(i) : 1, i, u });
      x += ws[i] + (o.track || 0);
    });
    L.forEach(l => {
      if (l.a <= 0) return;
      g.save(); g.globalAlpha = l.a; g.translate(l.x, l.y); g.rotate(l.rot); g.scale(l.sc, l.sc);
      g.textAlign = 'center';
      for (let d = depth; d >= 1; d--) { g.fillStyle = d === depth ? '#12002a' : `rgb(${50 + d * 3},0,${90 + d * 4})`; g.fillText(l.ch, d * 0.8, d * 0.9); }
      const hue = (o.hue0 || 0) + l.u * 300 - t * (o.cycle || 0);
      const gr = g.createLinearGradient(0, -size * 0.75, 0, size * 0.05);
      gr.addColorStop(0, hsl(hue, 100, 78)); gr.addColorStop(0.5, hsl(hue + 20, 100, 55)); gr.addColorStop(1, hsl(hue + 40, 100, 38));
      g.lineJoin = 'round'; g.lineWidth = Math.max(2, size * 0.06); g.strokeStyle = '#1a0033'; g.strokeText(l.ch, 0, 0);
      g.fillStyle = gr; g.fillText(l.ch, 0, 0);
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.save(); g.beginPath(); g.rect(-size, -size * 0.75, size * 2, size * 0.22); g.clip(); g.fillText(l.ch, 0, 0); g.restore();
      g.restore();
    });
    return tw;
  }
  function newBadge(g, x, y, r, t, seed) {
    if (Math.floor(t * 3.4 + seed) % 2 === 1) return;
    g.save(); g.translate(x, y); g.rotate(-0.25 + Math.sin(t * 6 + seed) * 0.08);
    g.beginPath();
    for (let k = 0; k < 28; k++) { const a = k / 28 * TAU, rr = k % 2 ? r * 0.72 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = '#ff1010'; g.fill(); g.lineWidth = Math.max(1, r * 0.06); g.strokeStyle = '#ffee00'; g.stroke();
    g.font = `400 ${r * 0.62}px ${BLACK}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffee00'; g.fillText('NEW!', 0, r * 0.04);
    g.restore();
  }
  function atSign(g, cx, cy, size, ang) {
    const c = Math.cos(ang), back = c < 0;
    g.save(); g.translate(cx, cy);
    g.font = `700 ${size}px ${ARI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const sx = Math.max(0.04, Math.abs(c));
    const depth = Math.round(size * 0.1 * Math.abs(Math.sin(ang)));
    for (let d = depth; d >= 1; d--) { g.save(); g.translate(d * Math.sign(Math.sin(ang)) * -1, 0); g.scale(sx, 1); g.fillStyle = '#7a4a00'; g.fillText('@', 0, 0); g.restore(); }
    g.scale(sx, 1);
    const gr = g.createLinearGradient(0, -size / 2, 0, size / 2);
    if (back) { gr.addColorStop(0, '#c08a20'); gr.addColorStop(1, '#5a3a00'); }
    else { gr.addColorStop(0, '#fff6b0'); gr.addColorStop(0.45, '#ffc820'); gr.addColorStop(1, '#b06a00'); }
    g.fillStyle = gr; g.fillText('@', 0, 0);
    g.lineWidth = Math.max(1, size * 0.02); g.strokeStyle = '#4a2a00'; g.strokeText('@', 0, 0);
    g.restore();
  }
  function construction(g, x, y, t, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    // diamond road sign
    g.save(); g.translate(60, 50); g.rotate(Math.PI / 4);
    g.fillStyle = '#111'; g.fillRect(-36, -36, 72, 72); g.fillStyle = '#ffcc00'; g.fillRect(-32, -32, 64, 64);
    g.strokeStyle = '#111'; g.lineWidth = 2; g.strokeRect(-28, -28, 56, 56);
    g.restore();
    // digging worker
    const a = Math.sin(t * 9) * 0.5;
    g.fillStyle = '#111'; g.strokeStyle = '#111'; g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.arc(52, 30, 5, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(53, 36); g.lineTo(57, 54); g.lineTo(50, 70); g.moveTo(57, 54); g.lineTo(64, 69); g.stroke();
    g.save(); g.translate(54, 40); g.rotate(0.6 + a);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(16, 6); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(10, 4); g.lineTo(26, 18); g.stroke();
    g.fillRect(23, 15, 7, 6); g.restore();
    g.beginPath(); g.moveTo(70, 72); g.quadraticCurveTo(78, 60 - a * 4, 88, 72); g.fill();
    g.lineCap = 'butt';
    // striped barrier with flashing lamps
    g.save(); g.beginPath(); g.rect(4, 100, 112, 18); g.clip();
    g.fillStyle = '#ffcc00'; g.fillRect(4, 100, 112, 18);
    g.fillStyle = '#111';
    const off = (t * 40) % 24;
    for (let k = -2; k < 8; k++) { g.beginPath(); g.moveTo(4 + k * 24 + off, 118); g.lineTo(16 + k * 24 + off, 100); g.lineTo(28 + k * 24 + off, 100); g.lineTo(16 + k * 24 + off, 118); g.fill(); }
    g.restore();
    g.strokeStyle = '#111'; g.lineWidth = 2; g.strokeRect(4, 100, 112, 18);
    g.fillStyle = '#333'; g.fillRect(14, 118, 5, 16); g.fillRect(101, 118, 5, 16);
    const on = Math.floor(t * 4) % 2;
    [[16, on], [104, 1 - on]].forEach(([lx, o]) => {
      g.fillStyle = o ? '#ffb000' : '#5a3000'; g.beginPath(); g.arc(lx, 94, 6, 0, TAU); g.fill();
      if (o) { const gl = g.createRadialGradient(lx, 94, 0, lx, 94, 22); gl.addColorStop(0, 'rgba(255,190,40,0.8)'); gl.addColorStop(1, 'rgba(255,190,40,0)'); g.fillStyle = gl; g.fillRect(lx - 22, 72, 44, 44); }
    });
    g.restore();
  }
  function flames(g, x, y, w, h, t) {
    for (let i = 0; i < w / 12; i++) {
      const fx = x + i * 12 + 6, fh = h * (0.55 + 0.45 * (vnoise(t * 9 + i * 1.7, 3) * 0.5 + 0.5));
      const gr = g.createLinearGradient(0, y + h, 0, y + h - fh);
      gr.addColorStop(0, '#ff2000'); gr.addColorStop(0.5, '#ff9000'); gr.addColorStop(1, '#fff060');
      g.fillStyle = gr; g.beginPath(); g.moveTo(fx - 6, y + h);
      g.quadraticCurveTo(fx - 7, y + h - fh * 0.5, fx + Math.sin(t * 12 + i) * 2, y + h - fh);
      g.quadraticCurveTo(fx + 7, y + h - fh * 0.5, fx + 6, y + h); g.fill();
    }
  }
  function odometer(g, x, y, val, digits, dw, dh) {
    const v = Math.max(0, val);
    g.fillStyle = '#000'; g.fillRect(x - 3, y - 3, digits * dw + 6, dh + 6);
    for (let k = 0; k < digits; k++) {
      const p = Math.pow(10, digits - 1 - k), raw = v / p, d = Math.floor(raw) % 10;
      // a digit only rolls while every digit to its right is passing 9 → 0
      const lower = v % p, frac = p === 1 ? raw - Math.floor(raw) : Math.max(0, (lower - (p - 1)) / 1);
      const dx = x + k * dw;
      const gr = g.createLinearGradient(0, y, 0, y + dh); gr.addColorStop(0, '#202020'); gr.addColorStop(0.5, '#3a3a3a'); gr.addColorStop(1, '#101010');
      g.fillStyle = gr; g.fillRect(dx + 1, y, dw - 2, dh);
      g.save(); g.beginPath(); g.rect(dx + 1, y, dw - 2, dh); g.clip();
      g.font = `700 ${dh * 0.8}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#3aff3a';
      const f = clamp(frac);
      g.fillText(String(d), dx + dw / 2, y + dh / 2 - f * dh); g.fillText(String((d + 1) % 10), dx + dw / 2, y + dh / 2 + dh - f * dh);
      g.restore();
    }
  }
  function marquee(g, s, x, y, w, size, t, speed, fam) {
    g.save(); g.beginPath(); g.rect(x, y - size, w, size * 1.4); g.clip();
    g.font = `700 ${size}px ${fam || COMIC}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const tw = g.measureText(s).width + 60;
    let xx = x + w - ((t * speed) % (tw + w));
    for (let rep = 0; rep < 2; rep++, xx += tw + w * 0) {
      let cx = xx;
      [...s].forEach((ch, i) => { const cw = g.measureText(ch).width; if (cx > x - cw && cx < x + w) { g.fillStyle = hsl(i * 24 - t * 360); g.fillText(ch, cx, y); } cx += cw; });
      xx = xx + tw;
    }
    g.restore();
  }
  function w98Window(g, x, y, w, h, title) {
    bev(g, x, y, w, h, 'raised');
    const tg = g.createLinearGradient(x, 0, x + w, 0); tg.addColorStop(0, '#000080'); tg.addColorStop(1, '#1084d0');
    g.fillStyle = tg; g.fillRect(x + 3, y + 3, w - 6, 18);
    bt(g, title, x + 7, y + 16, { color: '#ffffff', weight: 700 });
    bev(g, x + w - 21, y + 5, 16, 14, 'button'); w9Glyph(g, 'x', x + w - 13, y + 12);
  }
  function popIcon(g, k, x, y) {
    if (k === 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 16, y + 16, 15, 0, TAU); g.fill(); g.fillStyle = '#0000c0'; g.beginPath(); g.arc(x + 16, y + 16, 13, 0, TAU); g.fill(); bt(g, 'i', x + 16, y + 24, { color: '#ffffff', weight: 700, size: 20, font: TIN, align: 'center' }); }
    else if (k === 1) { g.fillStyle = '#000'; g.beginPath(); g.moveTo(x + 16, y + 1); g.lineTo(x + 32, y + 30); g.lineTo(x, y + 30); g.closePath(); g.fill(); g.fillStyle = '#ffff00'; g.beginPath(); g.moveTo(x + 16, y + 5); g.lineTo(x + 29, y + 28); g.lineTo(x + 3, y + 28); g.closePath(); g.fill(); g.fillStyle = '#000'; g.fillRect(x + 14, y + 11, 4, 10); g.fillRect(x + 14, y + 23, 4, 3); }
    else { g.fillStyle = '#800000'; g.beginPath(); g.arc(x + 16, y + 16, 15, 0, TAU); g.fill(); g.fillStyle = '#ff0000'; g.beginPath(); g.arc(x + 16, y + 16, 13, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 10, y + 10); g.lineTo(x + 22, y + 22); g.moveTo(x + 22, y + 10); g.lineTo(x + 10, y + 22); g.stroke(); }
  }
  const POPS = [
    ['CONGRATULATIONS!!!', 'You are the 1,000,000th visitor!', 0],
    ['Sign my Guestbook!!', 'Pleeeease?? :-)', 0],
    ['Warning', 'This page uses FRAMES.', 1],
    ['Java Applet', 'Loading sparkles.class ...', 0],
    ['You have new mail!', '1 unread message from Webmaster', 0],
    ['FREE Screensaver!!', 'Download now? (14.4k: 6 min)', 1],
    ['MIDI Error', 'Sound device is busy.', 2],
    ['Welcome!!!', 'Please BOOKMARK this page!', 0],
    ['Cool Site Award', 'You won the Hot Site of the Week!', 0],
    ['Script Error', 'Object expected. Line 1337.', 2],
  ];
  function popupAt(i) {
    const cas = i % 4, grp = Math.floor(i / 4) % 9;
    const P = [[300, 150], [40, 60], [640, 70], [60, 330], [620, 310], [340, 20], [180, 210], [500, 200], [360, 340]][grp];
    const bx = P[0] + (hash(i * 0.37) - 0.5) * 40, by = P[1] + (hash(i * 0.71) - 0.5) * 30;
    return { x: Math.round(bx + cas * 18), y: Math.round(by + cas * 18), k: POPS[i % POPS.length] };
  }
  const WB_SCROLL = [[0, 0], [2.75, 0], [3.3, 320, E.ioC], [3.85, 320], [4.45, 520, E.ioC], [10, 520]];
  const wbScroll = t => Math.round(kf(t, WB_SCROLL) / 20) * 20;
  const WB_CUR = [[2.0, 760, 330], [2.6, 140, 330, E.ioC], [2.85, 160, 400, E.ioC], [3.5, 470, 300, E.ioC], [4.1, 760, 250, E.ioC], [4.8, 330, 330, E.ioC], [5.2, 636, 288, E.ioC], [5.6, 640, 290], [6.4, 300, 200, E.ioC], [7.2, 700, 380, E.ioC], [7.7, 480, 270, E.ioC]];
  const wbCur = t => path2(t, WB_CUR);

  function wbPage(g, t, st, VW) {
    // page coordinates: width VW (944)
    const L = seg(t, WB.load, WB.load + 0.3);
    // tiled starfield background, rasterised in as rows of tiles
    const rows = Math.ceil(1100 / 128);
    for (let j = 0; j < rows; j++) {
      const rp = clamp(L * rows - j);
      if (rp <= 0) break;
      for (let i = 0; i < Math.ceil(VW / 128); i++) if (rp >= (i + 1) / Math.ceil(VW / 128)) g.drawImage(st.stars, i * 128, j * 128);
    }
    if (t < WB.load + 0.1) return;
    // twinkles
    for (let k = 0; k < 40; k++) {
      const x = hash(k * 3.3) * VW, y = hash(k * 5.1) * 1100, tw = Math.sin(t * (3 + hash(k) * 5) + k) * 0.5 + 0.5;
      if (tw > 0.55) sparkle(g, Math.round(x), Math.round(y), 2 + tw * 4, k % 3 ? '#ffffff' : '#a0e0ff');
    }
    // header — interlaced GIF passes
    const pass = t < WB.load + 0.08 ? -1 : t < WB.load + 0.2 ? 8 : t < WB.load + 0.32 ? 4 : t < WB.load + 0.44 ? 2 : 1;
    if (pass > 0) {
      const hg = st.hdr.g;
      hg.clearRect(0, 0, 944, 150);
      wordArt(hg, 'Welcome to my Homepage!', 472, 84, 54, t, { arch: 18, archRot: 0.2, cycle: 60, depth: 7 });
      hg.font = `700 22px ${COMIC}`; hg.textAlign = 'center';
      const sub = '~*~ SpArKlE’s CyBeR CaStLe ~*~';
      let sx = 472 - hg.measureText(sub).width / 2;
      [...sub].forEach((ch, i) => { hg.textAlign = 'left'; hg.fillStyle = hsl(i * 22 + t * 200, 100, 65); hg.fillText(ch, sx, 128); sx += hg.measureText(ch).width; });
      if (pass === 1) g.drawImage(st.hdr.c, 0, 0);
      else {
        const sg = st.hdrS.g; sg.imageSmoothingEnabled = true; sg.clearRect(0, 0, 944, 150);
        sg.drawImage(st.hdr.c, 0, 0, 944 / pass, 150 / pass);
        g.save(); g.imageSmoothingEnabled = false; g.drawImage(st.hdrS.c, 0, 0, 944 / pass, 150 / pass, 0, 0, 944, 150); g.restore();
      }
    }
    if (t > WB.load + 0.18) {
      g.fillStyle = '#000060'; g.fillRect(0, 146, VW, 26);
      g.fillStyle = '#4040ff'; g.fillRect(0, 146, VW, 1); g.fillRect(0, 171, VW, 1);
      marquee(g, '*** Thanks for visiting my page!!! *** Sign my GUESTBOOK before you leave!!! *** Last updated 11/02/97 ***', 0, 166, VW, 18, t, 170);
    }
    if (t > WB.load + 0.6) flames(g, 0, 176, VW, 22, t);
    // sidebar
    if (t > WB.load + 0.28) {
      g.save(); g.fillStyle = st.swirlPat; g.fillRect(14, 208, 210, 300); g.restore();
      bev(g, 14, 208, 210, 4, 'raised'); g.strokeStyle = '#c0c0ff'; g.lineWidth = 2; g.strokeRect(15, 209, 208, 298);
      bt(g, '~ MY LINKS ~', 119, 236, { size: 16, weight: 700, font: TIN, color: '#ffff00', align: 'center' });
      const links = ['Home', 'About Me', 'My Cats', 'Pictures', 'Cool Links', 'Guestbook', 'Awards'];
      links.forEach((s, i) => {
        if (t < WB.load + 0.3 + i * 0.05) return;
        const y = 268 + i * 32;
        g.save(); g.translate(34, y - 5); g.rotate(t * 3 + i); sparkle(g, 0, 0, 7, hsl(i * 50 + t * 120, 100, 65)); g.restore();
        g.font = `700 17px ${TIN}`; g.textAlign = 'left'; g.fillStyle = i === 1 && t > 2.6 && t < 2.9 ? '#ff00ff' : '#00ffff'; g.fillText(s, 50, y);
        g.fillRect(50, y + 3, g.measureText(s).width, 1.5);
        if (i === 2 || i === 4) newBadge(g, 182, y - 6, 16, t, i);
      });
    }
    // under construction + intro
    if (t > WB.load + 0.36) {
      const rp = seg(t, WB.load + 0.36, WB.load + 0.7);
      g.save(); g.beginPath(); g.rect(250, 210, 140, Math.floor(rp * 10) / 10 * 150); g.clip();
      construction(g, 260, 212, t);
      g.restore();
      if (rp < 1) { g.strokeStyle = '#808080'; g.lineWidth = 1; g.strokeRect(258.5, 212.5, 122, 138); }
      g.font = `700 26px ${TIN}`; g.textAlign = 'left';
      g.fillStyle = Math.floor(t * 3) % 2 ? '#ffff00' : '#ff3030'; g.fillText('This page is UNDER CONSTRUCTION!!!', 410, 246);
      g.font = `italic 700 18px ${TIN}`; g.fillStyle = '#ffffff'; g.fillText('Please be patient... come back soon!', 410, 274);
      g.font = `700 17px ${COMIC}`;
      ['Hi!! My name is Sparkle and this is my corner of the', 'World Wide Web!!! I like cats, MIDI files, the X-Files', 'and making webpages. Hope u like it!!! :-)'].forEach((s, i) => { g.fillStyle = ['#7fff00', '#ff80ff', '#80ffff'][i]; g.fillText(s, 410, 320 + i * 24); });
      newBadge(g, 880, 300, 24, t, 0.5);
      // spinning globe gif
      const gx = 470, gy = 440;
      g.fillStyle = '#1040c0'; g.beginPath(); g.arc(gx, gy, 32, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(gx, gy, 32, 0, TAU); g.clip(); g.fillStyle = '#30c040';
      for (let k = 0; k < 5; k++) { const lx = ((k * 40 + t * 50) % 200) - 100; g.beginPath(); g.ellipse(gx + lx, gy - 10 + (k % 3) * 12, 14, 9, 0.3, 0, TAU); g.fill(); }
      g.restore();
      g.strokeStyle = '#80c0ff'; g.lineWidth = 1.5; g.beginPath(); g.arc(gx, gy, 32, 0, TAU); g.stroke();
      g.font = `700 16px ${TIN}`; g.fillStyle = '#ffffff'; g.fillText('Welcome, surfer, from all over the WORLD!', 520, 446);
      g.fillStyle = '#ffff60'; g.fillText('This site is 100% Notepad made. No FrontPage!!', 520, 470);
    }
    // hit counter
    const cy = 540;
    bt(g, 'You are visitor number', 472, cy + 20, { size: 18, font: TIN, weight: 700, color: '#ffffff', align: 'center' });
    const cnt = lerp(1200, 1337, E.outC(seg(t, 3.85, 4.75)));
    odometer(g, 472 - 7 * 13, cy + 32, cnt, 7, 26, 34);
    bt(g, 'since March 14, 1997', 472, cy + 92, { size: 14, font: TIN, color: '#c0c0c0', align: 'center' });
    // rainbow rule
    const rg = g.createLinearGradient(0, 0, VW, 0);
    for (let k = 0; k <= 6; k++) rg.addColorStop(k / 6, hsl(k * 60 - t * 200, 100, 55));
    g.fillStyle = rg; g.fillRect(40, 648, VW - 80, 5);
    // e-mail + guestbook
    atSign(g, 250, 730, 92, t * 5);
    g.font = `700 34px ${COMIC}`; g.textAlign = 'left';
    [...'E-MAIL ME!!!'].reduce((x, ch, i) => { g.fillStyle = hsl(i * 30 + t * 300); g.fillText(ch, x, 744); return x + g.measureText(ch).width; }, 310);
    const pressed = t >= WB.click && t < WB.click + 0.12;
    bev(g, 560, 690, 210, 40, pressed ? 'pressed' : 'button');
    bt(g, 'Sign my Guestbook', 665 + (pressed ? 1 : 0), 715 + (pressed ? 1 : 0), { size: 14, weight: 700, align: 'center' });
    bev(g, 560, 740, 210, 40, 'button'); bt(g, 'View my Guestbook', 665, 765, { size: 14, weight: 700, align: 'center' });
    newBadge(g, 790, 700, 22, t, 1.5);
    // webring
    g.strokeStyle = '#ff00ff'; g.lineWidth = 3; g.strokeRect(150, 812, VW - 300, 70);
    g.fillStyle = 'rgba(60,0,80,0.8)'; g.fillRect(152, 814, VW - 304, 66);
    bt(g, '<< Prev  |  Random  |  Next >>', 472, 840, { size: 16, weight: 700, font: TIN, color: '#00ffff', align: 'center' });
    bt(g, 'This Cyber-Cats WebRing site is owned by Sparkle', 472, 866, { size: 13, font: TIN, color: '#ffffff', align: 'center' });
    // badges
    const badges = [['Best viewed at', '800 x 600', '#000080'], ['Made with', 'Notepad', '#008000'], ['Hot Site', 'of the Week!', '#800000'], ['Get a', 'FREE page!', '#806000']];
    badges.forEach(([a, b, c2], i) => {
      const bx = 150 + i * 166, by = 902;
      g.fillStyle = c2; g.fillRect(bx, by, 88, 31); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, 87, 30);
      bt(g, a, bx + 44, by + 13, { size: 10, color: '#ffffff', align: 'center' }); bt(g, b, bx + 44, by + 26, { size: 11, weight: 700, color: '#ffff00', align: 'center' });
    });
  }
  function wbChrome(g, t, st) {
    const W = 960;
    w98Window(g, 0, 0, W, 540, '~*~ SpArKlE’s CyBeR CaStLe ~*~ - WebSurfer 3.0');
    g.fillStyle = W9.face; g.fillRect(3, 22, W - 6, 16);
    ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Options', 'Directory', 'Window', 'Help'].reduce((x, s) => x + bt(g, s, x, 34) + 14, 10);
    g.fillStyle = W9.sh; g.fillRect(3, 38, W - 6, 1); g.fillStyle = W9.hi; g.fillRect(3, 39, W - 6, 1);
    const btns = ['Back', 'Forward', 'Home', 'Reload', 'Images', 'Open', 'Print', 'Find', 'Stop'];
    const loading = t < WB.done || (t > WB.click && t < WB.implode);
    btns.forEach((s, i) => {
      const x = 6 + i * 56;
      bev(g, x, 42, 54, 42, 'button');
      const ic = ['#2050c0', '#2050c0', '#c08000', '#008000', '#a000a0', '#606060', '#404040', '#806000', '#c00000'][i];
      const dim = (i === 1) || (i === 8 && !loading);
      g.fillStyle = dim ? '#808080' : ic;
      if (i < 2) { g.beginPath(); const d = i === 0 ? -1 : 1; g.moveTo(x + 27 + d * 10, 56); g.lineTo(x + 27 - d * 6, 47); g.lineTo(x + 27 - d * 6, 65); g.fill(); }
      else if (i === 2) { g.beginPath(); g.moveTo(x + 27, 46); g.lineTo(x + 38, 56); g.lineTo(x + 16, 56); g.fill(); g.fillRect(x + 19, 56, 16, 9); }
      else if (i === 8) { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.PI / 8; g.lineTo(x + 27 + Math.cos(a) * 10, 56 + Math.sin(a) * 10); } g.fill(); }
      else g.fillRect(x + 18, 48, 18, 16);
      bt(g, s, x + 27, 79, { size: 10, align: 'center', color: dim ? '#808080' : '#000000' });
    });
    // throbber
    const thx = W - 56;
    bev(g, thx, 42, 50, 42, 'sunken');
    g.fillStyle = '#000030'; g.fillRect(thx + 2, 44, 46, 38);
    g.fillStyle = '#3050ff'; g.beginPath(); g.arc(thx + 25, 63, 9, 0, TAU); g.fill();
    if (loading) { for (let k = 0; k < 6; k++) { const a = t * 7 - k * 0.35; g.fillStyle = `rgba(255,255,${150 + k * 20},${1 - k / 6})`; g.fillRect(Math.round(thx + 25 + Math.cos(a) * 16) - 1, Math.round(63 + Math.sin(a) * 9) - 1, 3, 3); } }
    else { g.fillStyle = '#ffff80'; g.fillRect(thx + 39, 52, 2, 2); }
    // location
    g.fillStyle = W9.face; g.fillRect(3, 86, W - 6, 22);
    bt(g, 'Location:', 10, 101, { weight: 700 });
    bev(g, 70, 88, W - 80, 18, 'field');
    bt(g, t < WB.load ? '' : 'http://www.homepages.net/~sparkle/index.html', 76, 101);
    // status bar
    bev(g, 3, 518, W - 6, 19, 'raised');
    const status = t < WB.conn ? 'Connect: Contacting host: www.homepages.net...' : t < WB.done ? `Document: Received ${Math.round(seg(t, WB.load, WB.done) * 42)} of 42K bytes` : t > WB.click && t < WB.implode ? 'Opening window...' : 'Document: Done';
    bt(g, status, 10, 532);
    bev(g, W - 160, 521, 150, 14, 'sunken');
    if (t >= WB.load && t < WB.done) { g.fillStyle = W9.navy; g.fillRect(W - 158, 523, 146 * seg(t, WB.load, WB.done), 10); }
  }
  function wbDial(g, t) {
    const x = 300, y = 190, w = 360, h = 150;
    w98Window(g, x, y, w, h, 'Connecting to SparkleNet');
    // two computers and a phone line
    for (let k = 0; k < 2; k++) w9Icon(g, 'computer', x + 20 + k * 90, y + 34);
    const ph = (t * 6) % 1;
    g.fillStyle = '#000'; for (let k = 0; k < 8; k++) g.fillRect(x + 56 + k * 7, y + 52, 3, 1);
    if (t > WB.dial) { g.fillStyle = '#ff0000'; g.fillRect(x + 56 + Math.floor(ph * 8) * 7, y + 50, 4, 4); }
    const st2 = t < WB.answer ? 'Dialing 555-0199...' : t < WB.hand + 0.18 ? 'Verifying user name and password...' : t < WB.conn - 0.02 ? 'Logging on to network...' : 'Connected at 56,000 bps';
    bt(g, 'Status:', x + 160, y + 46, { weight: 700 }); bt(g, st2, x + 160, y + 62);
    bt(g, 'User name: sparkle', x + 160, y + 82); bt(g, 'Phone: 555-0199', x + 160, y + 98);
    bev(g, x + w - 92, y + h - 34, 78, 22, 'button'); bt(g, 'Cancel', x + w - 53, y + h - 19, { align: 'center' });
    // modem lights
    ['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR'].forEach((s, i) => {
      const on = i === 3 ? t > WB.dial : i === 2 ? t > WB.conn - 0.05 : (i === 4 || i === 5) ? t > WB.hand && hash(Math.floor(t * 30) + i) > 0.4 : i === 6;
      g.fillStyle = on ? '#ff2020' : '#400000'; g.fillRect(x + 22 + i * 18, y + h - 26, 8, 5);
      bt(g, s, x + 26 + i * 18, y + h - 10, { size: 8, align: 'center' });
    });
  }
  function wbFinal(c, t, st, W, H) {
    const k = t - WB.lock;
    // starfield warp — the old screensaver, decelerating
    c.fillStyle = '#00000c'; c.fillRect(0, 0, W, H);
    const sp = 0.25 + 3.5 * Math.exp(-k * 4);
    const zt = k * 0.25 + (1 - Math.exp(-k * 4)) * 0.9;
    for (let i = 0; i < 420; i++) {
      const a = hash(i * 1.37) * TAU, z0 = hash(i * 2.11);
      const z = (z0 + zt) % 1, zp = Math.max(0, z - 0.02 * sp);
      const rr = Math.pow(z, 2.2) * 1300, rp = Math.pow(zp, 2.2) * 1300;
      const x = W / 2 + Math.cos(a) * rr, y = H / 2 + Math.sin(a) * rr * 0.8;
      const xp = W / 2 + Math.cos(a) * rp, yp = H / 2 + Math.sin(a) * rp * 0.8;
      c.strokeStyle = i % 9 === 0 ? '#ffe080' : i % 7 === 0 ? '#80c8ff' : '#ffffff';
      c.globalAlpha = Math.min(1, z * 1.6); c.lineWidth = 1 + z * 3;
      c.beginPath(); c.moveTo(xp, yp); c.lineTo(x + 0.5, y + 0.5); c.stroke();
    }
    c.globalAlpha = 1;
    // WordArt slams in, letter by letter
    const drop = (base) => i => -900 * (1 - E.outB(clamp((k - base - i * 0.025) / 0.32), 1.4));
    const alpha = (base) => i => clamp((k - base - i * 0.025) / 0.06);
    c.save(); c.shadowColor = 'rgba(160,60,255,0.7)'; c.shadowBlur = 40;
    wordArt(c, 'Welcome to', W / 2, 400, 128, t, { arch: 26, archRot: 0.18, cycle: 90, depth: 16, drop: drop(0.02), alpha: alpha(0.02), hue0: 0 });
    wordArt(c, 'my Homepage!', W / 2, 600, 150, t, { arch: -10, cycle: 90, depth: 20, drop: drop(0.2), alpha: alpha(0.2), hue0: 150 });
    c.restore();
    // flanking spinning e-mail @s
    const ap = E.outB(seg(k, 0.4, 0.75));
    if (ap > 0) { atSign(c, 190, 520, 170 * ap, t * 4); atSign(c, W - 190, 520, 170 * ap, t * 4 + Math.PI); }
    if (k > 0.55) newBadge(c, 1560, 290, 74, t, 0);
    if (k > 0.6) newBadge(c, 360, 260, 52, t, 1);
    // counter and marquee
    const cp = seg(k, 0.5, 0.7);
    if (cp > 0) {
      c.globalAlpha = cp;
      c.font = `700 34px ${TIN}`; c.textAlign = 'right'; c.fillStyle = '#ffffff'; c.fillText('You are visitor #', W / 2 - 40, 760);
      odometer(c, W / 2 - 20, 726, lerp(1300, 1337, E.outC(seg(k, 0.5, 1.4))), 7, 34, 44);
      c.globalAlpha = 1;
    }
    if (k > 0.3) {
      c.fillStyle = '#000060'; c.fillRect(0, 930, W, 64); c.fillStyle = '#4040ff'; c.fillRect(0, 930, W, 2); c.fillRect(0, 992, W, 2);
      marquee(c, '~*~ thanks for visiting ~*~ sign my guestbook ~*~ this page is under construction ~*~ best viewed at 800 x 600 ~*~', 0, 976, W, 40, t, 260);
    }
    // under-construction signs in the lower corners
    if (k > 0.45) { construction(c, 40, 760, t, 1.1); construction(c, W - 172, 760, t + 0.25, 1.1); }
    // twinkles around the lockup
    for (let i = 0; i < 26; i++) {
      const tw = Math.sin(t * (4 + hash(i) * 4) + i * 2) * 0.5 + 0.5;
      if (tw < 0.4 || k < 0.3) continue;
      sparkle(c, 300 + hash(i * 3.7) * 1320, 230 + hash(i * 9.1) * 520, 6 + tw * 16, hsl(i * 40 + t * 100, 100, 80));
    }
    // a sparkle-trail cursor drifts across
    const cx = lerp(1250, 1420, E.ioS(seg(k, 0.6, 2))), cy2 = lerp(880, 700, E.ioS(seg(k, 0.6, 2)));
    for (let j = 14; j >= 1; j--) {
      const tt = Math.max(0, k - j * 0.04);
      const px = lerp(1250, 1420, E.ioS(seg(tt, 0.6, 2))) + Math.sin(j * 1.7) * j * 1.4, py = lerp(880, 700, E.ioS(seg(tt, 0.6, 2))) + j * j * 0.35;
      if (k > 0.65) sparkle(c, px, py, (15 - j) * 0.9, hsl(j * 30 + t * 300, 100, 70));
    }
    c.save(); c.translate(cx, cy2); c.scale(2.2, 2.2); pixArrow(c, 0, 0); c.restore();
    // white flash at the reveal
    const fl = 1 - seg(k, 0, 0.35);
    if (fl > 0) { c.fillStyle = `rgba(255,255,255,${(fl * fl).toFixed(3)})`; c.fillRect(0, 0, W, H); }
  }

  MG.film({
    id: 'webcore', dur: 10, poster: 9.3,
    fonts: [['700 22px "Comic Neue"', 'A'], ['400 54px "Archivo Black"', 'A'], ['700 26px Tinos', 'A'], ['italic 700 18px Tinos', 'A'], ['400 11px Arimo', 'A'], ['700 11px Arimo', 'A'], ['700 30px "IBM Plex Mono"', '0']],
    meta: {
      family: 'G', name: 'Webcore / Web 1.0', sub: 'Early-internet Maximalism', era: '1994 — 2009',
      origin: 'The hand-coded personal homepage of the early web: GeoCities (1994–2009), Angelfire and Tripod gave anyone free space, and amateurs filled it with tiled backgrounds, animated GIFs, MIDI files and blink/marquee tags; Olia Lialina and Dragan Espenschied later archived it as folk art.',
      works: 'GeoCities neighbourhoods (1994–2009) · Space Jam official site (1996) · Olia Lialina & Dragan Espenschied — One Terabyte of Kilobyte Age (2013–) · Internet Archive GifCities (2016) · Netscape Navigator 3 blink & marquee tags',
      tech: ['Tiled starfield & swirl backgrounds', 'Animated GIFs: NEW!, @, construction', 'Marquee, hit counter, pop-up cascade'],
      accent: '#ff00ff',
      motionDNA: 'Everything loops at once at GIF frame-rates: blinking, spinning, scrolling, counting, until pop-ups multiply into overload and collapse into one shouting lockup.',
      visualDNA: 'Black starfields and tiled textures, saturated rainbow WordArt with 3D extrusion, Times and Comic Sans, bevelled grey browser chrome and dial-up era status bars.',
      transitions: 'Dial-up connect, interlaced GIF load, stepped wheel scroll, pop-up multiplication, window implosion, white flash, starfield warp',
      implementation: ['HTML 3.2', 'Animated GIF', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const scr = mk(960, 540), hdr = mk(944, 150), hdrS = mk(944, 150), big = mk(1920, 1080);
      return { scr, hdr, hdrS, big };
    },
    draw(ctx, t, W, H, st) {
      if (!st.stars) { st.stars = starTile(1997, 70); st.swirlPat = st.scr.g.createPattern(swirlTile(), 'repeat'); }
      if (t < WB.flash) {
        const g = st.scr.g;
        g.save();
        wbChrome(g, t, st);
        // page viewport
        const VX = 3, VY = 108, VW = 938, VH = 410;
        g.beginPath(); g.rect(VX, VY, VW + 16, VH); g.clip();
        g.fillStyle = t < WB.load ? '#c0c0c0' : '#000010'; g.fillRect(VX, VY, VW + 16, VH);
        const sy = wbScroll(t);
        g.save(); g.translate(VX, VY - sy);
        if (t >= WB.load) wbPage(g, t, st, VW);
        g.restore();
        // scrollbar
        bev(g, VX + VW, VY, 16, VH, 'sunken'); g.fillStyle = '#e0e0e0'; g.fillRect(VX + VW + 1, VY + 1, 14, VH - 2);
        const th = VH * VH / 1000;
        bev(g, VX + VW, VY + 16 + (VH - 32 - th) * (sy / 600), 16, th, 'button');
        bev(g, VX + VW, VY, 16, 16, 'button'); bev(g, VX + VW, VY + VH - 16, 16, 16, 'button');
        g.restore();
        if (t < WB.conn + 0.04) wbDial(g, t);
        // pop-up cascade
        const ip = seg(t, WB.implode, WB.flash);
        for (let i = 0; i < WB.nPop; i++) {
          const t0 = popT(i);
          if (t < t0) break;
          const p = popupAt(i), [title, msg, ic] = p.k;
          const s = E.outB(seg(t, t0, t0 + 0.08)) * (1 - E.inC(ip));
          if (s <= 0.01) continue;
          const pw = 250, ph = 100;
          const cx = lerp(p.x + pw / 2, 480, E.inC(ip)), cy = lerp(p.y + ph / 2, 280, E.inC(ip));
          g.save(); g.translate(Math.round(cx), Math.round(cy)); g.scale(s, s); g.translate(-pw / 2, -ph / 2);
          w98Window(g, 0, 0, pw, ph, title);
          popIcon(g, ic, 12, 32);
          bt(g, msg, 54, 50);
          bev(g, pw / 2 - 36, ph - 32, 72, 22, 'button'); bt(g, 'OK', pw / 2, ph - 17, { align: 'center' });
          g.restore();
        }
        // cursor + sparkle trail
        if (t > 2.0) {
          for (let j = 18; j >= 1; j--) {
            const tt = t - j * 0.035;
            if (tt < 2.0) continue;
            const [px, py] = wbCur(tt);
            const jx = (hash(Math.floor(tt * 30) * 1.3 + j) - 0.5) * 8, fall = j * j * 0.08;
            sparkle(g, Math.round(px + jx + 4), Math.round(py + fall + 6), Math.max(1, (19 - j) * 0.42), hsl(j * 25 + t * 400, 100, 72));
          }
          const [cx, cy] = wbCur(t);
          pixArrow(g, cx, cy);
        }
        // blit with a little camera life
        const z = kf(t, [[0, 2.0], [1.25, 1.75, E.lin], [1.6, 1, E.ioC], [5.3, 1], [7.6, 1.1]]);
        const shake = t > WB.pop0 && t < WB.flash ? seg(t, WB.pop0, WB.implode) * 6 : 0;
        const fx = 960, fy = kf(t, [[0, 530], [1.25, 530], [1.6, 540]]);
        st.big.g.imageSmoothingEnabled = false; st.big.g.drawImage(st.scr.c, 0, 0, 1920, 1080);
        ctx.save();
        ctx.translate(fx + (hash(Math.floor(t * 24)) - 0.5) * shake, fy + (hash(Math.floor(t * 24) + 9) - 0.5) * shake);
        ctx.scale(z, z); ctx.translate(-fx, -fy);
        ctx.drawImage(st.big.c, 0, 0);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
        const fl = seg(t, WB.implode + 0.1, WB.flash);
        if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl.toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
      } else {
        wbFinal(ctx, t, st, W, H);
      }
      grain(ctx, W, H, t, 0.04);
      vignette(ctx, W, H, 0.3);
    },
    score(A) {
      // dial-up: dial tone, DTMF, answer tone, handshake screech
      A.osc(0.0, { f: 350, dur: 0.28, g: 0.04, hold: true, rel: 0.02 }); A.osc(0.0, { f: 440, dur: 0.28, g: 0.04, hold: true, rel: 0.02 });
      const R = [697, 770, 852, 941], C = [1209, 1336, 1477];
      [[1, 1], [1, 1], [1, 1], [3, 1], [3, 0], [0, 2], [2, 2]].forEach(([r, c], i) => {
        const tt = 0.3 + i * 0.065;
        A.osc(tt, { f: R[r], dur: 0.05, g: 0.035, hold: true, rel: 0.005 }); A.osc(tt, { f: C[c], dur: 0.05, g: 0.035, hold: true, rel: 0.005 });
      });
      A.osc(WB.answer, { f: 2100, dur: 0.16, g: 0.03, hold: true, rel: 0.01 });
      A.osc(WB.hand, { f: 1650, dur: 0.06, g: 0.03, hold: true, rel: 0.005 }); A.osc(WB.hand + 0.06, { f: 980, dur: 0.06, g: 0.03, hold: true, rel: 0.005 });
      for (let k = 0; k < 8; k++) A.noise(WB.hand + 0.1 + k * 0.025, { type: 'bandpass', f: 1200 + hash(k) * 2400, q: 4, dur: 0.03, g: 0.08 });
      A.noise(WB.hand + 0.12, { type: 'bandpass', f: 1800, f2: 2600, q: 0.9, dur: 0.2, g: 0.07, hold: true, rel: 0.02 });
      A.osc(WB.hand + 0.12, { type: 'square', f: 1200, f2: 2400, glide: 0.1, dur: 0.2, g: 0.012, lp: 3000 });
      A.noise(WB.conn - 0.02, { type: 'highpass', f: 3000, dur: 0.02, g: 0.06 });
      // General-MIDI homepage tune (140 bpm)
      const b = WB_BEAT, M0 = WB.music;
      const chords = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [45, 48, 52], [41, 45, 48]];
      const mel = [72, 76, 79, 76, 81, 79, 76, 72, 77, 81, 84, 81, 79, 77, 74, 71, 72, 76, 79, 84, 83, 81, 79, 76, 77, 76, 74, 72];
      const end = WB.implode;
      for (let k = 0; k < 28; k++) {
        const tt = M0 + k * b / 2;
        if (tt >= end) break;
        const m = mel[k];
        A.osc(tt, { type: 'square', f: midi(m), dur: b * 0.45, g: 0.03, hold: true, rel: 0.03, lp: 3200, pan: 0.15 });
        A.osc(tt, { type: 'triangle', f: midi(m + 12), dur: b * 0.3, g: 0.012 });
        const ch = chords[Math.floor(k / 4)], root = ch[0] - 12;
        A.osc(tt, { type: 'triangle', f: midi(k % 2 ? root + 12 : root), dur: b * 0.45, g: 0.13, hold: true, rel: 0.03 });
        A.hat(tt, k % 2 ? 0.03 : 0.045, false, { pan: -0.2 });
        if (k % 4 === 0) { A.kick(tt, 0.45, { f: 120, f2: 45, dur: 0.25 }); ch.forEach(n => A.pluck(tt, midi(n + 12), { g: 0.08, dur: 0.8, bright: 0.5, rev: 0.25 })); }
        if (k % 4 === 2) A.snare(tt, 0.18, { f: 1800, dur: 0.12, rev: 0.12 });
      }
      // continue the groove under the pop-ups, getting more frantic
      for (let k = 28; ; k++) {
        const tt = M0 + k * b / 2;
        if (tt >= end) break;
        const m = mel[(k * 3) % 28] + (k % 8 > 5 ? 12 : 0);
        A.osc(tt, { type: 'square', f: midi(m), dur: b * 0.4, g: 0.026, hold: true, rel: 0.03, lp: 3200 });
        A.osc(tt, { type: 'triangle', f: midi(36 + (k % 2) * 12 + [0, -3, -7, -5][Math.floor(k / 4) % 4]), dur: b * 0.45, g: 0.12, hold: true, rel: 0.03 });
        A.hat(tt, 0.04); if (k % 2 === 0) A.kick(tt, 0.4, { f: 120, f2: 45, dur: 0.22 }); if (k % 4 === 2) A.snare(tt, 0.18, { f: 1800, dur: 0.12 });
      }
      A.noise(WB.done, { type: 'highpass', f: 5000, dur: 0.01, g: 0.04 });
      // click + pop-up dings
      A.noise(WB.click, { type: 'highpass', f: 2500, dur: 0.012, g: 0.14 });
      for (let i = 0; i < WB.nPop; i++) {
        const tt = popT(i), gg = 0.045 / (1 + i * 0.05);
        A.bell(tt, midi(84 + (i % 3) * 2), { g: gg, dur: 0.35, ratios: [1, 2], rev: 0.15, pan: (hash(i) - 0.5) * 1.2 });
        A.bell(tt + 0.07, midi(79 + (i % 3) * 2), { g: gg * 0.8, dur: 0.4, ratios: [1, 2], rev: 0.15, pan: (hash(i) - 0.5) * 1.2 });
      }
      // implosion and reveal
      A.noise(WB.implode, { type: 'bandpass', f: 5000, f2: 300, q: 1.5, dur: 0.22, g: 0.12 });
      A.osc(WB.implode, { type: 'square', f: 900, f2: 60, glide: 0.2, dur: 0.22, g: 0.03, lp: 2500 });
      A.impact(WB.lock, 0.35, { rev: 0.6 });
      A.noise(WB.lock, { type: 'highpass', f: 5000, dur: 1.6, g: 0.05, rev: 0.6 });
      A.chord(WB.lock, [48, 55, 60, 64, 67, 72], { type: 'sawtooth', dur: 2.0, g: 0.018, a: 0.01, hold: true, rel: 1.0, lp: 3600, spread: 9, rev: 0.6, width: 1.4 });
      A.osc(WB.lock, { f: midi(36), dur: 1.8, g: 0.14 });
      [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => A.bell(WB.lock + 0.1 + i * 0.06, midi(m), { g: 0.035, dur: 1.4, rev: 0.6, pan: (i / 6 - 0.5) }));
      // the letters land
      for (let i = 0; i < 10; i++) A.noise(WB.lock + 0.33 + i * 0.025, { type: 'bandpass', f: 800 + i * 120, q: 2, dur: 0.04, g: 0.05 });
      A.kick(WB.lock + 0.52, 0.5, { f: 110, f2: 40, dur: 0.4 });
      // little MIDI ta-da
      [[0, 72], [0.11, 76], [0.22, 79]].forEach(([d, m]) => A.osc(8.7 + d, { type: 'square', f: midi(m), dur: 0.1, g: 0.03, lp: 3000, hold: true, rel: 0.02 }));
      A.chord(9.03, [72, 76, 79, 84], { type: 'square', dur: 0.75, g: 0.016, lp: 3000, hold: true, rel: 0.4, rev: 0.4 });
      A.chord(9.03, [48, 60], { type: 'triangle', dur: 0.8, g: 0.08, hold: true, rel: 0.4 });
      A.snare(9.03, 0.12, { f: 3000, dur: 0.5, rev: 0.5 });
    },
  });

  /* =====================================================================
     E · AUDIO REACTIVE — one score, read twice: once by Web Audio, once by draw()
     ===================================================================== */
  // THE SCORE (written first). 144 bpm, 24 beats. Bars: 1 sine blips · 2 sub pulse + hats · 3 build/roll · 4–5 drop · final hit.
  const AR = (() => {
    const bpm = 144, b = 60 / bpm, S = b / 4;
    const at = (beat, six = 0) => +(beat * b + six * S).toFixed(5);
    const ev = { blip: [], click: [], hat: [], ohat: [], kick: [], snare: [], clap: [], bass: [], lead: [], stab: [],
      drone: [{ t: 0, d: at(11, 3), f: 55 }], riser: [{ t: at(8), d: at(12) - at(8) }], impact: [{ t: at(20), g: 1 }],
      bpm, b, S, at, drop: at(12), end: at(20), beats: 24 };
    const blipSteps = [0, 3, 6, 10, 12, 13], blipF = [1000, 2000, 4000, 1000, 8000, 2000];
    for (let bar = 0; bar < 3; bar++) {
      blipSteps.forEach((s, i) => ev.blip.push({ t: at(bar * 4, s), f: blipF[(i + bar) % 6], g: s === 0 ? 1 : 0.6, acc: s === 0 }));
      [2, 7, 11, 15].forEach(s => ev.click.push({ t: at(bar * 4, s), g: 1 }));
    }
    for (let k = 0; k < 8; k++) ev.hat.push({ t: at(4, k * 2 + 1), g: 0.6 });
    [33, 33, 36, 31].forEach((m, i) => { ev.bass.push({ t: at(4 + i, 2), m, d: S * 1.6, g: 0.7, lp: 260 }); });
    // bar 3: build
    for (let k = 0; k < 3; k++) ev.kick.push({ t: at(8 + k), g: 0.75 });
    for (let k = 0; k < 16; k++) ev.hat.push({ t: at(8, k), g: k % 2 ? 0.35 : 0.6 });
    for (let k = 0; k < 8; k++) ev.bass.push({ t: at(8, k * 2), m: 33, d: S * 1.5, g: 0.8, lp: 260 + k * 160 });
    [[8, 0], [8, 2], [9, 0], [9, 2], [10, 0], [10, 1], [10, 2], [10, 3]].forEach(([bt0, s], i) => ev.snare.push({ t: at(bt0, s), g: 0.35 + i * 0.04, roll: true }));
    for (let k = 0; k < 8; k++) ev.snare.push({ t: +(at(11) + k * S / 2).toFixed(5), g: 0.6 + k * 0.05, roll: true, fast: true });
    // bars 4–5: the drop
    const prog = [[33, [57, 60, 64]], [29, [57, 60, 65]], [36, [55, 60, 64]], [31, [55, 59, 62]]];
    for (let beat = 12; beat < 20; beat++) {
      ev.kick.push({ t: at(beat), g: 1 });
      if (beat % 2 === 1) ev.clap.push({ t: at(beat), g: 1 });
      [0, 1, 3].forEach(s => ev.hat.push({ t: at(beat, s), g: s ? 0.45 : 0.7 }));
      ev.ohat.push({ t: at(beat, 2), g: 0.7 });
      const ci = Math.floor((beat - 12) / 2) % 4, [root, ch] = prog[ci];
      [0, 2].forEach((s, j) => ev.bass.push({ t: at(beat, s), m: root + (j ? 12 : 0), d: S * 1.7, g: 1, lp: 1100 }));
      [0, 1, 2, 3].forEach(s => ev.lead.push({ t: at(beat, s), m: ch[[0, 1, 2, 1][s]] + 12 + (s === 3 && beat % 2 ? 12 : 0), d: S * 0.9, g: 0.8, ci }));
      if ((beat - 12) % 2 === 0) ev.stab.push({ t: at(beat), ch, d: b * 1.7, ci });
    }
    ev.kick.push({ t: at(20), g: 1.1 });
    ev.stab.push({ t: at(20), ch: [57, 60, 64, 69], d: 1.5, ci: 0 });
    ev.bass.push({ t: at(20), m: 33, d: 0.9, g: 1, lp: 700 });
    ev.blip.push({ t: at(22), f: 1000, g: 1, acc: true });
    Object.values(ev).forEach(v => Array.isArray(v) && v.sort((a, c) => a.t - c.t));
    return ev;
  })();
  const LN = Math.log;
  const envL = (list, t, dec, win = 7) => { let s = 0; for (const e of list) { const d = t - e.t; if (d < 0) break; if (d < dec * win) s += (e.g ?? 1) * Math.exp(-d / dec); } return s; };
  const noteAmp = (e, t, rel = 0.08) => { const d = t - e.t; if (d < 0) return 0; return (d < e.d ? 1 : Math.exp(-(d - e.d) / rel)) * Math.min(1, d / 0.004) * (e.g ?? 1); };
  const lastBefore = (list, t) => { let r = null; for (const e of list) { if (e.t > t) break; r = e; } return r; };
  const NB = 96, LF0 = LN(30), LF1 = LN(16000);
  const gauss = (x, c, w) => { const u = (x - c) / w; return Math.exp(-u * u); };
  // everything the picture knows about the sound at time t
  function arState(t) {
    const F = {
      kick: envL(AR.kick, t, 0.11), snare: envL(AR.snare, t, 0.06) + envL(AR.clap, t, 0.12), hat: envL(AR.hat, t, 0.03) + envL(AR.ohat, t, 0.1) * 0.8,
      click: envL(AR.click, t, 0.012), blip: envL(AR.blip, t, 0.05), imp: envL(AR.impact, t, 0.7), notes: [],
    };
    let bassA = 0, leadA = 0;
    AR.bass.forEach(e => { const a = noteAmp(e, t, 0.06); if (a > 0.003) { F.notes.push([midi(e.m), a, 4, Math.min(1, e.lp / 1200)]); bassA += a; } });
    AR.lead.forEach(e => { const a = noteAmp(e, t, 0.09); if (a > 0.003) { F.notes.push([midi(e.m), a * 0.7, 3, 1]); leadA += a; } });
    AR.stab.forEach(e => { const d = t - e.t; if (d < 0 || d > e.d + 1.5) return; const a = Math.exp(-d / (e.d * 0.6)) * 0.6; e.ch.forEach(m => F.notes.push([midi(m), a, 3, 0.8])); });
    F.blips = AR.blip.filter(e => t >= e.t && t - e.t < 0.3).map(e => [e.f, Math.exp(-(t - e.t) / 0.05) * e.g]);
    const rz = AR.riser[0], rp = seg(t, rz.t, rz.t + rz.d);
    F.riser = rp > 0 && rp < 1 ? rp : 0;
    F.drone = t < AR.drone[0].d ? 0.35 : 0;
    F.bass = bassA; F.lead = leadA;
    return F;
  }
  function arSpec(F, out) {
    for (let i = 0; i < NB; i++) {
      const lf = LF0 + (i / (NB - 1)) * (LF1 - LF0);
      let v = F.kick * 1.4 * gauss(lf, LN(58), 0.55) + F.kick * 0.15 * gauss(lf, LN(3500), 1.2)
        + F.snare * 0.75 * gauss(lf, LN(1800), 1.3) + F.hat * 0.8 * gauss(lf, LN(10000), 0.5)
        + F.click * 0.35 + F.drone * gauss(lf, LN(55), 0.12) + F.imp * 0.9 * gauss(lf, LN(80), 1.0);
      for (const [f, a, h, lp] of F.notes) for (let k = 1; k <= h; k++) v += a * Math.pow(lp, k - 1) * (1 / k) * 0.9 * gauss(lf, LN(f * k), 0.07);
      for (const [f, a] of F.blips) v += a * 1.1 * gauss(lf, LN(f), 0.05);
      if (F.riser) v += F.riser * F.riser * 0.8 * gauss(lf, LN(400) + F.riser * LN(15), 0.45);
      out[i] = 1 - Math.exp(-v * 1.2);
    }
    return out;
  }
  // waveform ring: integer "petal" harmonics derived from the sounding pitches
  function arWave(F, th, t) {
    let w = F.drone * 0.12 * Math.sin(2 * th + t * 0.8) + F.kick * 0.18;
    for (const [f, a, h] of F.notes) { const n = 3 + Math.round(LN(f / 27.5) / LN(2) * 3) % 9 + (h === 3 ? 6 : 0); w += a * (h === 3 ? 0.035 : 0.09) * Math.sin(n * th + t * (h === 3 ? -3 : 2)); }
    for (const [f, a] of F.blips) w += a * 0.06 * Math.sin(Math.round(f / 250) * th);
    w += F.snare * 0.07 * Math.sin(37 * th + t * 30) + F.hat * 0.03 * Math.sin(64 * th - t * 50);
    return w;
  }
  const pal = (h, s = 1) => { const c = k => Math.round(255 * clamp(0.5 + 0.5 * Math.cos(TAU * (h + k)) * s + (1 - s) * 0.5)); return [c(0), c(0.33), c(0.67)]; };
  function arPlasma(g, img, t, F, amt) {
    const PW = 240, PH = 135, d = img.data, T = t * 1.1;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const dx = x - PW / 2, dy = (y - PH / 2) * 1.2, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
      const v = Math.sin(x * 0.06 + T) + Math.sin(y * 0.085 - T * 1.3) + Math.sin(r * 0.16 - T * 3.2 - F.kick * 2) + Math.sin(a * 5 + r * 0.045 + T * 0.9);
      const h = v * 0.14 + t * 0.09;
      const br = (0.12 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(v * 3.1 + T), 2.2)) * amt * (0.6 + 0.4 * Math.min(1, F.kick));
      const i = (y * PW + x) * 4;
      d[i] = (0.5 + 0.5 * Math.cos(TAU * h)) * 255 * br; d[i + 1] = (0.5 + 0.5 * Math.cos(TAU * (h + 0.33))) * 255 * br; d[i + 2] = (0.5 + 0.5 * Math.cos(TAU * (h + 0.67))) * 255 * br; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const AR_LOG = (() => {
    const L = [];
    const add = (k, list, f) => list.forEach(e => L.push({ t: e.t, s: f(e), k }));
    add('BLIP', AR.blip, e => `SIN ${String(e.f).padStart(5, ' ')}HZ`);
    add('CLK', AR.click, () => 'CLICK  0.004S');
    add('KICK', AR.kick, e => `KICK   ${e.g.toFixed(2)}`);
    add('SNR', AR.snare, e => `SNARE  ${e.g.toFixed(2)}`);
    add('CLAP', AR.clap, () => 'CLAP   1.00');
    add('BASS', AR.bass, e => `BASS   ${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][e.m % 12]}${Math.floor(e.m / 12) - 1}`);
    add('IMP', AR.impact, () => 'IMPACT 1.00');
    return L.sort((a, b) => a.t - b.t);
  })();

  MG.film({
    id: 'audioreactive', dur: 10, poster: 6.05,
    fonts: [['400 18px "IBM Plex Mono"', 'A'], ['600 64px "IBM Plex Mono"', 'A']],
    meta: {
      family: 'E', name: 'Audio Reactive', sub: 'Music Drives the Picture', era: '1998 —',
      origin: 'Real-time visuals computed from sound: Winamp’s visualiser plug-ins (AVS 1999, Ryan Geiss’s MilkDrop 2001) put FFT-driven feedback art on every PC, VJ culture took it to club screens, and Ryoji Ikeda turned raw signal and data into monumental minimalist audiovisual works.',
      works: 'Ryan Geiss — MilkDrop (2001) · Nullsoft Winamp AVS (1999) · Ryoji Ikeda — test pattern (2008) & datamatics (2006) · Robert Hodgin — Magnetosphere / iTunes visualiser (2008) · Carsten Nicolai (alva noto) — unitxt (2008)',
      tech: ['Event list shared by score & picture', 'FFT-style radial spectrum & peak caps', 'Feedback tunnel, kick zoom, snare bursts'],
      accent: '#00e5ff',
      motionDNA: 'Nothing moves on its own: every pulse, zoom, flash and burst is an envelope of a kick, snare, hat or note, so motion lands exactly on the beat.',
      visualDNA: 'Ikeda monochrome — hairlines, barcodes and data readouts on black — exploding at the drop into MilkDrop’s saturated plasma, mirrored spectra and feedback tunnels.',
      transitions: 'Barcode strobe, inversion flash, build zoom, blackout breath, drop explosion, collapse to data',
      implementation: ['Web Audio + Canvas 2D', 'TouchDesigner', 'GLSL (MilkDrop presets)'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { const pl = mk(240, 135); return { pl, img: pl.g.createImageData(240, 135), sp: Array.from({ length: 12 }, () => new Float32Array(NB)) }; },
    draw(c, t, W, H, st) {
      const F = arState(t), spec = arSpec(F, st.sp[0]);
      const CX = W / 2, CY = 520;
      const beat = t / AR.b;
      const inDrop = t >= AR.drop && t < AR.end;
      const color = t < AR.drop ? 0 : t < AR.end ? 1 : 1 - E.ioS(seg(t, AR.end + 0.05, AR.end + 0.8));
      const outro = seg(t, AR.end + 0.35, AR.end + 0.9);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      // MilkDrop plasma
      if (color > 0.01) {
        arPlasma(st.pl.g, st.img, t, F, 1);
        c.save(); c.globalAlpha = color * 0.85; c.imageSmoothingEnabled = true; c.drawImage(st.pl.c, 0, 0, W, H); c.restore();
        const dg = c.createRadialGradient(CX, CY, 80, CX, CY, 700);
        dg.addColorStop(0, `rgba(0,0,0,${0.75 * color})`); dg.addColorStop(0.55, `rgba(0,0,0,${0.35 * color})`); dg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = dg; c.fillRect(0, 0, W, H);
      }
      // camera: slow build push, kick-driven zoom on the drop
      const build = E.inQ(seg(t, AR.at(8), AR.drop));
      const z = 1 + build * 0.22 * (t < AR.drop ? 1 : 0) + (inDrop ? F.kick * 0.07 : 0) + F.imp * 0.06;
      const rot = (t * 0.05 + build * 0.6 * (t < AR.drop ? 1 : 0)) * (1 - E.ioS(seg(t, AR.end, AR.end + 1)));
      c.save(); c.translate(CX, CY); c.scale(z, z); c.translate(-CX, -CY);
      const R0 = (t < AR.at(4) ? 0 : 230) * E.outC(seg(t, AR.at(4) - 0.1, AR.at(4) + 0.5)) + F.kick * 26 + F.imp * 60;
      const ringPath = (FF, tt, R, s) => {
        c.beginPath();
        for (let i = 0; i <= 200; i++) { const th = (i / 200) * TAU; const r = R * s * (1 + arWave(FF, th, tt)); const x = CX + Math.cos(th + rot) * r, y = CY + Math.sin(th + rot) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.closePath();
      };
      // feedback tunnel: the same ring at earlier times, zoomed outward
      if (color > 0.01) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 12; k >= 1; k--) {
          const tt = t - k * 0.04, FF = arState(tt);
          const s = 1 + k * 0.13 * (1 + F.kick * 0.4);
          c.save(); c.translate(CX, CY); c.rotate(k * 0.07 * Math.sin(t * 0.7)); c.translate(-CX, -CY);
          const [r, g, b] = pal((t - AR.drop) * 0.12 + k * 0.05);
          c.strokeStyle = `rgba(${r},${g},${b},${((1 - k / 13) * 0.8 * color).toFixed(3)})`; c.lineWidth = 3 + k * 1.1;
          ringPath(FF, tt, Math.max(R0, 230), s); c.stroke();
          c.restore();
        }
        c.restore();
      }
      if (R0 > 1) {
        // radial spectrum, mirrored left/right
        const L = 220 + build * 60;
        c.save(); c.translate(CX, CY); c.rotate(rot);
        for (let side = -1; side <= 1; side += 2) for (let i = 0; i < NB; i++) {
          const v = spec[i], th = -Math.PI / 2 + side * ((i + 0.5) / NB) * Math.PI;
          const len = 4 + v * L * (0.35 + 0.65 * color + build * 0.4);
          const ca = Math.cos(th), sa = Math.sin(th);
          if (color > 0.02) { const [r, g, b] = pal(i / NB * 0.8 + (t - AR.drop) * 0.1); c.strokeStyle = `rgba(${r},${g},${b},${0.35 + 0.65 * color})`; }
          else c.strokeStyle = `rgba(255,255,255,${0.5 + v * 0.5})`;
          c.lineWidth = color > 0.02 ? 6 : 2;
          c.beginPath(); c.moveTo(ca * (R0 + 14), sa * (R0 + 14)); c.lineTo(ca * (R0 + 14 + len), sa * (R0 + 14 + len)); c.stroke();
        }
        c.restore();
        // the live ring
        c.save();
        c.shadowColor = color > 0.02 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'; c.shadowBlur = 18;
        c.strokeStyle = '#fff'; c.lineWidth = 2 + F.kick * 4 + F.imp * 6;
        ringPath(F, t, R0, 1); c.stroke();
        c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.shadowBlur = 0;
        c.beginPath(); c.arc(CX, CY, Math.max(1, R0 * 0.72), 0, TAU); c.stroke();
        c.restore();
      }
      // particle bursts on claps (and the final hit)
      c.save(); c.globalCompositeOperation = 'lighter';
      [...AR.clap, ...AR.impact].forEach((e, n) => {
        const d = t - e.t;
        if (d < 0 || d > 1.3) return;
        const big = e === AR.impact[0], cnt = big ? 260 : 140;
        for (let p = 0; p < cnt; p++) {
          const a = hash(n * 97 + p * 1.37) * TAU, v = (big ? 900 : 600) + hash(p * 3.1 + n) * (big ? 1600 : 900), k = 3.2;
          const dist = (R0 + 10) + v * (1 - Math.exp(-k * d)) / k, dist2 = (R0 + 10) + v * (1 - Math.exp(-k * Math.max(0, d - 0.035))) / k;
          const al = (1 - d / 1.3) * (0.6 + 0.4 * hash(p));
          const [r, g, b] = big ? [255, 255, 255] : pal(n * 0.21 + p * 0.002 + 0.1);
          c.strokeStyle = `rgba(${r},${g},${b},${al.toFixed(3)})`; c.lineWidth = 1.5 + hash(p * 7) * 2.5;
          c.beginPath(); c.moveTo(CX + Math.cos(a) * dist2, CY + Math.sin(a) * dist2); c.lineTo(CX + Math.cos(a) * dist, CY + Math.sin(a) * dist); c.stroke();
        }
      });
      c.restore();
      c.restore(); // camera
      // Ikeda layer: hairline oscilloscope + barcode band on blips
      const hair = 1 - color * 0.7;
      if (hair > 0.05 && outro < 1) {
        c.save(); c.globalAlpha = hair * (1 - outro);
        c.strokeStyle = '#fff'; c.lineWidth = 1.2;
        c.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const u = x / W;
          let y = Math.sin(u * TAU * 3 + t * 2) * 6 * F.drone * 2;
          for (const [f, a] of F.blips) y += Math.sin(u * TAU * f / 40 - t * 60) * 60 * a;
          y += Math.sin(u * TAU * 1.5 - t * 9) * 50 * F.bass * (t < AR.drop ? 1 : 0.3);
          y += (hash(Math.floor(x / 3) + Math.floor(t * 60) * 0.37) - 0.5) * 50 * F.click;
          x ? c.lineTo(x, CY + y) : c.moveTo(x, CY + y);
        }
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.6)';
        for (let x = 0; x <= W; x += 24) c.fillRect(x, CY + 40, 1, x % 240 === 0 ? 14 : 6);
        // the score itself: this bar's events as marks, swept by a playhead
        if (t < AR.drop) {
          const bar = Math.floor(beat / 4), b0 = bar * 4 * AR.b, bd = 4 * AR.b, px = (t - b0) / bd * W;
          const mark = (list, h, y0) => list.forEach(e => { if (e.t < b0 || e.t >= b0 + bd) return; const x = (e.t - b0) / bd * W; const on = e.t <= t; c.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.28)'; c.fillRect(Math.round(x), CY + y0, on && t - e.t < 0.08 ? 3 : 1, h); });
          mark(AR.blip, 120, -250); mark(AR.click, 40, -210); mark(AR.hat, 24, 120); mark(AR.kick, 90, 110); mark(AR.snare, 60, 140); mark(AR.bass, 30, 210);
          c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(Math.round(px), CY - 270, 1, 520);
          c.font = `400 13px ${MONO}`; c.fillText(`BAR ${bar + 1}  ${(t - b0).toFixed(3)}`, px + 8, CY - 256);
        }
        c.font = `400 13px ${MONO}`; c.textAlign = 'left';
        for (let x = 0; x < W; x += 240) c.fillText(`${(x / W * AR.b * 4).toFixed(3)}`, x + 4, CY + 70);
        c.restore();
      }
      const lb = lastBefore(AR.blip, t);
      if (lb && t - lb.t < 0.22 && outro < 1) {
        const d = t - lb.t, a = Math.exp(-d / 0.06), idx = AR.blip.indexOf(lb);
        const full = lb.acc && d < 0.05;
        const y0 = full ? 0 : CY - 150, hh = full ? H : 300;
        c.save(); c.globalAlpha = a * (lb.acc ? 1 : 0.8);
        const r = rng(idx * 31 + 7);
        let x = 0;
        while (x < W) { const w = 1 + Math.floor(r() * r() * 24); if (r() < 0.5) { c.fillStyle = '#fff'; c.fillRect(x, y0, w, hh); } x += w; }
        c.restore();
      }
      // strobe on the 32nd roll, blackout breath just before the drop
      const ls = lastBefore(AR.snare, t);
      if (ls && ls.fast && t - ls.t < 0.03) { c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
      if (t > AR.drop - 0.04 && t < AR.drop) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
      // beat flash
      if (inDrop || F.imp > 0.05) {
        const fl = Math.max(inDrop ? F.kick * 0.16 : 0, F.imp > 0.5 ? (F.imp - 0.5) * 1.2 : 0);
        if (fl > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,255,255,${Math.min(0.9, fl).toFixed(3)})`; c.fillRect(0, 0, W, H); c.restore(); }
      }
      // spectrum analyser with falling peak caps
      const show = E.outC(seg(t, AR.at(4), AR.at(4) + 0.4)) * (1 - outro);
      if (show > 0) {
        for (let j = 1; j < 12; j++) arSpec(arState(t - j * 0.06), st.sp[j]);
        const nb = 64, x0 = 120, x1 = W - 120, bw = (x1 - x0) / nb, base = H - 70, mh = 120;
        for (let i = 0; i < nb; i++) {
          const si = Math.floor(i * NB / nb), v = spec[si];
          let pk = v;
          for (let j = 1; j < 12; j++) pk = Math.max(pk, st.sp[j][si] - 3.2 * Math.pow(j * 0.06, 2));
          const x = x0 + i * bw, h = v * mh * show;
          if (color > 0.02) { const [r, g, b] = pal(i / nb * 0.7 + t * 0.1); c.fillStyle = `rgb(${r},${g},${b})`; } else c.fillStyle = '#fff';
          for (let yy = 0; yy < h; yy += 6) c.fillRect(x + 1, base - yy - 4, bw - 3, 4);
          c.fillStyle = '#fff'; c.fillRect(x + 1, base - pk * mh * show - 8, bw - 3, 2);
        }
        c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x0, base + 4, x1 - x0, 1);
      }
      // data HUD (reads the same event list)
      const hud = 1 - outro;
      if (hud > 0) {
        c.save(); c.globalAlpha = hud * 0.9;
        c.font = `400 17px ${MONO}`; c.textAlign = 'left'; c.fillStyle = '#fff';
        const bi = Math.min(AR.beats, Math.floor(beat) + 1);
        [`SCORE.DAT  ${AR.bpm}.000 BPM`, `BEAT ${String(bi).padStart(2, '0')}/${AR.beats}  BAR ${Math.floor(beat / 4) + 1}`, `T ${t.toFixed(3)} S`, t < AR.at(8) ? 'MODE  SINE / DATA' : t < AR.drop ? 'MODE  BUILD ▲' : t < AR.end ? 'MODE  DROP' : 'MODE  DECAY'].forEach((s, i) => c.fillText(s, 64, 72 + i * 26));
        // channel meters
        [['KICK', F.kick], ['SNR', F.snare], ['HAT', F.hat], ['BASS', F.bass], ['LEAD', F.lead * 0.6], ['SINE', F.blip]].forEach(([s, v], i) => {
          const y = 210 + i * 22;
          c.globalAlpha = hud * 0.75; c.fillText(s, 64, y);
          c.fillRect(130, y - 11, 160 * clamp(v), 10);
          c.globalAlpha = hud * 0.25; c.fillRect(130, y - 11, 160, 10);
        });
        c.globalAlpha = hud * 0.9; c.textAlign = 'right';
        let n = 0;
        for (let i = AR_LOG.length - 1; i >= 0 && n < 14; i--) {
          const e = AR_LOG[i];
          if (e.t > t) continue;
          const age = t - e.t;
          c.globalAlpha = hud * (age < 0.08 ? 1 : 0.35 + 0.4 * (1 - n / 14));
          c.fillStyle = age < 0.08 ? (color > 0.1 ? '#00e5ff' : '#fff') : '#fff';
          c.fillText(`${e.t.toFixed(3)}  ${e.s}`, W - 64, 72 + n * 24);
          n++;
        }
        c.restore();
      }
      // resolve: the data lockup
      if (outro > 0) {
        const a = E.outC(outro);
        c.save(); c.globalAlpha = a;
        c.textAlign = 'center'; c.fillStyle = '#fff';
        c.font = `600 60px ${MONO}`;
        if ('letterSpacing' in c) c.letterSpacing = '18px';
        c.fillText('AUDIO', CX + 9, CY - 10);
        c.fillText('REACTIVE', CX + 9, CY + 62);
        if ('letterSpacing' in c) c.letterSpacing = '4px';
        c.font = `400 17px ${MONO}`; c.globalAlpha = a * 0.8;
        c.fillText(`${AR.bpm} BPM · ${AR.beats} BEATS · ${AR.kick.length} KICKS · ${AR.snare.length + AR.clap.length} SNARES · ${AR.bass.length + AR.lead.length} NOTES`, CX + 2, H - 90);
        c.fillText('ONE SCORE → SOUND + PICTURE', CX + 2, H - 60);
        if ('letterSpacing' in c) c.letterSpacing = '0px';
        c.restore();
      }
      if (color > 0.02) grain(c, W, H, t, 0.05 * color);
      vignette(c, W, H, 0.45);
    },
    score(A) {
      // drone + Ikeda sine blips and clicks
      A.osc(0, { f: 55, dur: AR.drone[0].d, g: 0.12, a: 0.3, hold: true, rel: 0.1 });
      A.osc(0, { f: 110.3, dur: AR.drone[0].d, g: 0.02, a: 0.6, hold: true, rel: 0.1 });
      AR.blip.forEach(e => A.osc(e.t, { f: e.f, dur: e.acc ? 0.09 : 0.05, g: (e.f > 5000 ? 0.025 : 0.05) * e.g, hold: true, rel: 0.006, a: 0.002, pan: e.f > 3000 ? 0.4 : -0.2 }));
      AR.click.forEach(e => A.noise(e.t, { type: 'highpass', f: 6000, dur: 0.005, g: 0.18 }));
      AR.hat.forEach(e => A.hat(e.t, 0.07 * e.g, false, { pan: 0.25 }));
      AR.ohat.forEach(e => A.hat(e.t, 0.06 * e.g, true, { pan: -0.25 }));
      AR.kick.forEach(e => A.kick(e.t, 0.85 * e.g, { f: 160, f2: 42, dur: 0.45 }));
      AR.snare.forEach(e => A.snare(e.t, 0.28 * e.g, { f: 1900, dur: e.fast ? 0.05 : 0.09, rev: 0.1 }));
      AR.clap.forEach(e => { A.clap(e.t, 0.32, { rev: 0.25 }); A.snare(e.t, 0.22, { f: 2200, dur: 0.14, rev: 0.2 }); });
      AR.bass.forEach(e => {
        A.osc(e.t, { type: 'sawtooth', f: midi(e.m), dur: e.d, g: 0.11 * e.g, lp: e.lp, q: 4, hold: true, rel: 0.05 });
        A.osc(e.t, { f: midi(e.m), dur: e.d, g: 0.16 * e.g, hold: true, rel: 0.05 });
      });
      AR.lead.forEach(e => { A.pluck(e.t, midi(e.m), { g: 0.16, dur: 0.4, bright: 0.85, rev: 0.25, pan: ((e.m % 5) / 4 - 0.5) * 0.7 }); A.osc(e.t, { type: 'square', f: midi(e.m), dur: e.d, g: 0.012, lp: 3500 }); });
      AR.stab.forEach(e => A.chord(e.t, e.ch, { type: 'sawtooth', dur: e.d, g: 0.02, a: 0.005, lp: 4000, lp2: 700, lpT: e.d, spread: 12, rev: 0.45, width: 1.4 }));
      const rz = AR.riser[0];
      A.riser(rz.t, rz.d - 0.06, { g: 0.13, f: 110 });
      A.noise(AR.drop, { type: 'highpass', f: 3000, dur: 1.4, g: 0.07, rev: 0.6 });
      A.impact(AR.end, 0.5, { rev: 0.7 });
    },
  });
})();
