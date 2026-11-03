/* batch h13 — Family D: 3D & CGI Motion (Holographic / Iridescent · Point Cloud / LiDAR) · Family J: Contemporary Social & Commercial Motion (Corporate Memphis). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, rng, hash, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;800&family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter+Tight:wght@500;700&family=Plus+Jakarta+Sans:wght@500;700;800&display=block');
  const PI = Math.PI;
  const UNB = 'Unbounded, sans-serif', SG = '"Space Grotesk", sans-serif', MONO = '"IBM Plex Mono", monospace', TIGHT = '"Inter Tight", sans-serif', JAK = '"Plus Jakarta Sans", sans-serif';

  // 2D value noise in [0, 1] on MG.hash: a seeded lattice blended with smoothstep.
  function n2(x, y, s = 0) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (i, j) => hash(i * 157.31 + j * 311.71 + s * 71.37);
    return lerp(lerp(h(ix, iy), h(ix + 1, iy), ux), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux), uy);
  }

  /* =====================================================================
     HOLOGRAPHIC / IRIDESCENT — a sheet of crumpled holographic foil
     fills the frame and tilts under a sweeping light, its thin-film
     colours sliding with the view angle; the creases relax into a pastel
     gradient and a liquid-chrome drop rises out of it, splits into
     beads that orbit, merge and pinch apart, then pours itself into
     inflated blob type; a prism throws a spectrum across the letters,
     foil stickers slap down around them and the title settles
     ===================================================================== */
  const HO = { ink: '#2a2346', dim: 'rgba(42,35,70,0.62)', accent: '#c58cff', chip: 'rgba(255,255,255,0.55)' };
  const HO_T = { drop: 2.1, split: 3.0, gather: 4.35, morph: 4.9, morphE: 5.8, prism: 5.95, st: [6.4, 6.72, 7.04], title: 7.85, sub: 8.3 };
  const HO_BW = 768, HO_BH = 432, HO_K = HO_BW / 640, HO_TS = 196, HO_TY = 214;
  const HO_FK = 4 * PI * 1.33;   // thin-film phase constant: 4π·n (soap / oil film, n ≈ 1.33)
  // Ball choreography in a 640×360 frame (scaled to the buffer): a drop that splits into six beads, which find the four letters.
  function hoBalls(t, L) {
    const cx = 320, cy = 182, out = [];
    const rise = k => E.outB(seg(t - k, HO_T.drop, HO_T.drop + 0.8), 1.3);
    const wob = t > HO_T.drop ? 7 * Math.sin((t - HO_T.drop) * 10) * Math.exp(-Math.max(0, t - HO_T.drop - 0.75) * 3.5) : 0;
    const w = E.ioS(seg(t, HO_T.split - 0.05, HO_T.split + 0.3)), sp = E.outB(seg(t, HO_T.split, HO_T.split + 0.75), 1.4);
    const ga = E.ioC(seg(t, HO_T.gather, HO_T.gather + 0.8)), tt = t - HO_T.split;
    const map = [0, 1, 2, 3, 0, 2], dyL = [-4, 8, -6, 8, -52, -48];
    for (let i = 0; i < 6; i++) {
      // the drop: four cores stacked at its head, two beads trailing like a drip running upward
      const dx = cx, dyy = i < 4 ? lerp(480, cy, rise(0)) + wob : lerp(520 + (i - 4) * 40, cy + (i - 4) * 6, rise(0.06 + 0.05 * (i - 4))), dr = i < 4 ? 31 : i === 4 ? 25 : 18;
      // the orbit: alternating directions so the beads keep passing through each other
      const a = (i / 6) * TAU + tt * (0.95 + 0.22 * (i % 3)) * (i % 2 ? 1 : -1);
      const ox = cx + sp * (150 + 22 * (i % 3)) * Math.cos(a), oy = cy + sp * (58 + 16 * (i % 2)) * Math.sin(a * (i % 2 ? 1 : 2) * 0.5 + i);
      const orr = 26 + 5 * (i % 3);
      let x = lerp(dx, ox, w), y = lerp(dyy, oy, w), r = lerp(dr, orr, w);
      const l = L[map[i]];
      x = lerp(x, l[0], ga); y = lerp(y, l[1] + dyL[i], ga); r = lerp(r, i < 4 ? 30 : 22, ga);
      out.push(x * HO_K, y * HO_K, (r * HO_K) * (r * HO_K));
    }
    return out;
  }
  // The per-pixel shader: implicit liquid / type surface, normals from its height, thin-film colour from the view angle.
  function hoRender(st, t) {
    const W = HO_BW, H = HO_BH, S = st.S, Hh = st.Hh, ts = st.ts, fgx = st.fgx, fgy = st.fgy, th = st.thick, d = st.img.data;
    const m = E.ioC(seg(t, HO_T.morph, HO_T.morphE));
    const useB = t > HO_T.drop - 0.05 && m < 1, balls = useB ? hoBalls(t, st.L) : null;
    const liquid = (t > HO_T.drop ? 1 : 0) * (1 - 0.75 * m), R = lerp(40, 25, m) * HO_K, any = useB || m > 0;
    // pass 1: the implicit surface s (>0 inside) and its inflated height
    if (any) {
      const lw = 0.045 * liquid, ph1 = t * 5.2, ph2 = t * 4.1;
      for (let y = 0, i = 0; y < H; y++) {
        const wy = Math.sin(y * 0.052 - ph2);
        for (let x = 0; x < W; x++, i++) {
          let sb = -1;
          if (balls) {
            let F = 0;
            for (let k = 0; k < 18; k += 3) { const ddx = x - balls[k], ddy = y - balls[k + 1]; F += balls[k + 2] / (ddx * ddx + ddy * ddy + 1); }
            sb = F > 0.5 ? 1 - 1 / F : -1;
          }
          let s = m <= 0 ? sb : m >= 1 ? ts[i] : lerp(sb, ts[i], m);
          if (s > -0.3) s += lw * Math.sin(x * 0.06 + ph1) * wy;
          S[i] = s; Hh[i] = s > 0 ? R * Math.sqrt(s) : 0;
        }
      }
    }
    // view vector (the sheet / camera tilt), light sweep, crease amplitude
    const tvx = kf(t, [[0, -0.75], [2.0, 0.7, E.ioS], [3.6, -0.2, E.ioS], [5.9, 0.15, E.ioS], [7.5, -0.45, E.ioS], [10, 0.1, E.ioS]]);
    const tvy = kf(t, [[0, 0.35], [1.2, -0.25, E.ioS], [2.6, 0.15, E.ioS], [6.0, 0.05, E.ioS], [7.6, 0.28, E.ioS], [10, 0.12, E.ioS]]);
    const relax = E.ioC(seg(t, 1.85, 2.9)), crA = lerp(11, 4, relax), sat = lerp(0.5, 0.44, relax);
    const bend = lerp(0.25, 0.9, relax), filmT = 90 * Math.sin(t * 0.7) + t * 22;
    const lxp = lerp(-0.9, 0.9, E.ioS(seg(t, 0.15, 2.0))), lgt = [lxp, 0.55, 0.65], ll = Math.hypot(lgt[0], lgt[1], lgt[2]);
    const Lx = lgt[0] / ll, Ly = lgt[1] / ll, Lz = lgt[2] / ll;
    const sw = kf(t, [[0, -1.6], [2.2, -1.6], [3.6, 1.6, E.ioS], [5.6, -1.6], [5.9, -1.6], [7.4, 1.6, E.ioS], [8.2, -1.6], [9.6, 1.4, E.ioS]]);
    const glint = lerp(2.2, 0.7, relax), shOff = 8 + 14 * W;
    for (let y = 0, i = 0; y < H; y++) {
      const vyB = tvy - (y / H - 0.5) * 0.34, byy = -bend * 0.5 * (y / H - 0.5);
      for (let x = 0; x < W; x++, i++) {
        const vxB = tvx + (x / W - 0.5) * 0.6, vl = 1 / Math.sqrt(vxB * vxB + vyB * vyB + 1), vx = vxB * vl, vy = vyB * vl, vz = vl;
        // ---- the foil: crumpled-sheet normal + a gentle bend across the frame ----
        let nx = -fgx[i] * crA + bend * (x / W - 0.5), ny = fgy[i] * crA + byy, nz = 1;
        const nl = 1 / Math.sqrt(nx * nx + ny * ny + 1); nx *= nl; ny *= nl; nz = nl;
        const cosT = nx * vx + ny * vy + nz * vz, ph = HO_FK * (300 + 360 * th[i] + filmT) * cosT;
        let r = 1 - sat + sat * (0.5 + 0.5 * Math.cos(ph / 650)), g = 1 - sat + sat * (0.5 + 0.5 * Math.cos(ph / 530)), b = 1 - sat + sat * (0.5 + 0.5 * Math.cos(ph / 445));
        const hx = Lx + vx, hy = Ly + vy, hz = Lz + vz, hl = 1 / Math.sqrt(hx * hx + hy * hy + hz * hz);
        let q = Math.max(0, (nx * hx + ny * hy + nz * hz) * hl); q *= q; q *= q; q *= q; q *= q; q *= q;   // ^32
        const dif = 0.8 + 0.22 * (nx * Lx + ny * Ly + nz * Lz), sp = q * glint;
        r = r * dif + sp; g = g * dif + sp; b = b * dif + sp * 0.95;
        // contact shadow of the liquid / type, cast down-right
        if (any) { const j = i - shOff; if (j >= 0) { const sh = Math.min(1, Hh[j] / (R * 0.75)) * 0.3; r *= 1 - sh; g *= 1 - sh * 1.05; b *= 1 - sh * 0.85; } }
        // ---- liquid chrome / blob type ----
        const s = any ? S[i] : -1;
        if (s > -0.08) {
          const xm = x > 0 ? i - 1 : i, xp = x < W - 1 ? i + 1 : i, ym = y > 0 ? i - W : i, yp = y < H - 1 ? i + W : i;
          let bx = -(Hh[xp] - Hh[xm]) * 0.5, by = (Hh[yp] - Hh[ym]) * 0.5, bz = 1;
          const bl = 1 / Math.sqrt(bx * bx + by * by + 1); bx *= bl; by *= bl; bz = bl;
          const ndv = Math.max(0, bx * vx + by * vy + bz * vz), rx = 2 * ndv * bx - vx, ry = 2 * ndv * by - vy;
          // studio environment: sky dome, a hard horizon, dark floor, a key softbox and a moving strip
          let e = ry > 0 ? 0.45 + 0.55 * Math.min(1, ry * 1.5) : 0.2 + 0.2 * Math.max(0, 1 + ry * 2);
          e += 1.0 * Math.exp(-((ry - 0.06) * (ry - 0.06)) / 0.003);
          e += 1.9 * Math.exp(-((rx + 0.42) * (rx + 0.42) + (ry - 0.52) * (ry - 0.52)) / 0.022);
          e += 1.3 * Math.exp(-((rx - sw) * (rx - sw)) / 0.005) * (ry > -0.1 ? 1 : 0.25);
          const fr = 1 - ndv, fres = fr * fr * fr, ph2 = HO_FK * (240 + 300 * th[i] + 420 * fr + filmT * 1.5) * Math.max(0.2, ndv);
          const Ir = 0.5 + 0.5 * Math.cos(ph2 / 650), Ig = 0.5 + 0.5 * Math.cos(ph2 / 530), Ib = 0.5 + 0.5 * Math.cos(ph2 / 445);
          const wh = e > 1 ? (e - 1) * 0.55 : 0;
          const cr = e * (0.22 + 0.88 * Ir) + fres * 0.55 * Ir + wh, cg = e * (0.22 + 0.88 * Ig) + fres * 0.55 * Ig + wh, cb = e * (0.26 + 0.9 * Ib) + fres * 0.6 * Ib + wh;
          const a = clamp(s * 16 + 0.55);
          r = lerp(r, cr, a); g = lerp(g, cg, a); b = lerp(b, cb, a);
        }
        const o = i * 4;
        d[o] = r * 255; d[o + 1] = g * 255; d[o + 2] = b * 255; d[o + 3] = 255;
      }
    }
    st.buf.getContext('2d').putImageData(st.img, 0, 0);
  }
  // Holographic sticker: die-cut white border, drop shadow, a conic foil sheen that turns with the tilt, a shine sweep.
  function hoSticker(c, t, t0, x, y, rot, shape, sz, label) {
    if (t < t0) return;
    const p = E.outB(seg(t, t0, t0 + 0.34), 2.2), sc = lerp(1.55, 1, p), al = seg(t, t0, t0 + 0.07);
    c.save(); c.globalAlpha = al; c.translate(x, y); c.rotate(rot + (1 - p) * 0.5); c.scale(sc, sc);
    const path = () => {
      c.beginPath();
      if (shape === 'star') {
        for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? sz * 0.48 : sz; k ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        c.closePath();
      } else if (shape === 'bolt') {
        const P = [[0.2, -1], [-0.55, 0.12], [-0.02, 0.12], [-0.25, 1], [0.6, -0.2], [0.06, -0.2], [0.35, -1]];
        P.forEach(([px, py], k) => (k ? c.lineTo(px * sz, py * sz) : c.moveTo(px * sz, py * sz))); c.closePath();
      } else c.arc(0, 0, sz, 0, TAU);
    };
    c.lineJoin = 'round';
    c.shadowColor = 'rgba(60,30,110,0.28)'; c.shadowBlur = 26; c.shadowOffsetY = 10;
    path(); c.lineWidth = 26; c.strokeStyle = '#fbfaff'; c.stroke(); c.fillStyle = '#fbfaff'; c.fill();
    c.shadowColor = 'transparent';
    const g = c.createConicGradient(t * 0.9 + rot * 3 + x * 0.002, sz * 0.2, -sz * 0.15);
    ['#ff9fd8', '#ffe39a', '#a6ffd6', '#8fd9ff', '#c7a2ff', '#ff9fd8'].forEach((col, k) => g.addColorStop(k / 5, col));
    path(); c.fillStyle = g; c.fill();
    // fine diffraction lines and a travelling shine
    c.save(); path(); c.clip();
    c.globalAlpha = 0.22; c.strokeStyle = '#ffffff'; c.lineWidth = 1.5;
    for (let k = -sz * 1.4; k < sz * 1.4; k += 9) { c.beginPath(); c.moveTo(k, -sz * 1.2); c.lineTo(k + sz * 0.6, sz * 1.2); c.stroke(); }
    const shx = lerp(-sz * 2.2, sz * 2.2, seg(t, t0 + 0.3, t0 + 1.0));
    const sg = c.createLinearGradient(shx - 50, 0, shx + 50, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalAlpha = 0.85; c.fillStyle = sg; c.fillRect(-sz * 1.5, -sz * 1.5, sz * 3, sz * 3);
    c.restore();
    if (label) label.forEach(([s, yy, fs]) => text(c, s, 0, yy, { font: UNB, weight: 800, size: fs, color: HO.ink, align: 'center', base: 'middle', ls: 2 }));
    c.restore();
  }
  function hoChip(c, s, t, a, b) {
    const u = seg(t, a, a + 0.25) * (1 - seg(t, b - 0.25, b)); if (u <= 0) return;
    c.save(); c.globalAlpha = u;
    c.font = `700 22px ${SG}`; const w = c.measureText(s).width + s.length * 3 + 64;
    c.fillStyle = HO.chip; rrect(c, 80, 74, w, 50, 25); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5; c.stroke();
    const g = c.createLinearGradient(96, 88, 116, 110); g.addColorStop(0, '#ff9fd8'); g.addColorStop(0.5, '#a6ffd6'); g.addColorStop(1, '#8fd9ff');
    c.fillStyle = g; c.beginPath(); c.arc(106, 99, 9, 0, TAU); c.fill();
    text(c, s, 128, 107, { font: SG, weight: 700, size: 22, color: HO.ink, ls: 3 });
    c.restore();
  }

  MG.film({
    id: 'holographic', dur: 10, poster: 9.4,
    fonts: [['800 196px Unbounded', 'holoHOLOGRAPHICNEWAVE%10'], ['500 30px Unbounded', 'Holographic'], ['700 22px "Space Grotesk"', '0123·HOLGRAPICFUQDMEBYTSKNZ+'], ['500 30px "Space Grotesk"', 'Thin-film Foil and Liquid Chrome']],
    meta: {
      family: 'D', name: 'Holographic', sub: 'Thin-film Foil and Liquid Chrome', era: '2016 — 2020',
      origin: 'A late-2010s look in which every surface seems coated in oil-slick foil: thin-film interference colour that shifts with the viewing angle, liquid chrome blobs, prismatic light and inflated blobby 3D type, rendered in Cinema 4D with Octane or Redshift and spread across album art, fashion, packaging and brand identities. It borrowed holographic stickers, trading-card foil and mirror-polished sculpture and fed straight into the Y2K-revival and "acid graphics" moods of the early 2020s.',
      works: 'Newton’s rings (Isaac Newton, Opticks, 1704) · Balloon Dog (Jeff Koons, 1994–2000) · Cloud Gate (Anish Kapoor, Chicago, 2004–06) · Pokémon Trading Card Game holo cards (Wizards of the Coast, 1999)',
      tech: ['Thin-film colour from normal · view', 'Metaball liquid morphing to type', 'Inflated text height field'],
      accent: '#c58cff',
      motionDNA: 'Slow, sensual and liquid: the foil tilts and the colours slide across it before anything moves, chrome swells, stretches, pinches into beads and re-merges with springy overshoot, the blobs pour into type, and light sweeps travel across every surface on long eases while stickers slap down with a snap.',
      visualDNA: 'Pastel thin-film rainbows (pink, mint, lilac, butter yellow) on crumpled foil and soft gradients; mirror chrome with hard studio horizons and white softbox highlights tinted by iridescence; fat rounded type inflated like a balloon; die-cut holographic stickers with white borders; spectral prism fans.',
      transitions: 'Foil hero tilt → creases relax into gradient → drop rises and splits → beads morph into type → prism sweep + sticker slaps → title',
      implementation: ['Cinema 4D + Octane / Redshift thin-film shaders', 'Blender Cycles thin-film / iridescence nodes', 'Photoshop gradient maps and foil textures', 'Canvas 2D: per-pixel metaball + inflated-text height field (768×432, upscaled), thin-film interference per channel from the normal and view vector'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = HO_BW, H = HO_BH, N = W * H;
      const buf = offscreen(W, H), img = buf.getContext('2d').createImageData(W, H);
      // crumpled foil: ridged value noise (sharp creases), differentiated once
      const foil = new Float32Array(N), thick = new Float32Array(N), fgx = new Float32Array(N), fgy = new Float32Array(N);
      for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
        let h = 0, a = 1, f = 1 / (90 * HO_K);
        for (let o = 0; o < 4; o++) { h += a * (1 - Math.abs(n2(x * f, y * f, o + 1) * 2 - 1)); a *= 0.45; f *= 2.13; }
        foil[i] = h;
        thick[i] = n2(x / (170 * HO_K), y / (170 * HO_K), 9) * 0.7 + n2(x / (64 * HO_K), y / (64 * HO_K), 11) * 0.3;
      }
      for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
        fgx[i] = (foil[x < W - 1 ? i + 1 : i] - foil[x > 0 ? i - 1 : i]) * 0.5;
        fgy[i] = (foil[y < H - 1 ? i + W : i] - foil[y > 0 ? i - W : i]) * 0.5;
      }
      // the type: blurred glyph coverage → signed field (0 at the rounded outline), letter centres for the beads
      const tc = offscreen(W, H), g = tc.getContext('2d');
      g.font = `800 ${HO_TS}px ${UNB}`; g.textAlign = 'left'; g.textBaseline = 'middle';
      const word = 'holo', tw = g.measureText(word).width, x0 = W / 2 - tw / 2;
      const L = [];
      for (let k = 0; k < word.length; k++) {
        const a = g.measureText(word.slice(0, k)).width, b = g.measureText(word.slice(0, k + 1)).width;
        L.push([(x0 + (a + b) / 2) / HO_K, (HO_TY + HO_TS * 0.06) / HO_K]);
      }
      g.filter = `blur(${(8 * HO_K).toFixed(1)}px)`; g.fillStyle = '#fff';
      g.fillText(word, x0, HO_TY);
      const dd = g.getImageData(0, 0, W, H).data, ts = new Float32Array(N);
      for (let i = 0; i < N; i++) ts[i] = (dd[i * 4 + 3] / 255 - 0.5) * 2.2;
      return { buf, img, fgx, fgy, thick, ts, L, S: new Float32Array(N).fill(-1), Hh: new Float32Array(N) };
    },
    draw(c, t, W, H, st) {
      hoRender(st, t);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.buf, 0, 0, W, H);
      // opening: the sheet fades up from white
      if (t < 0.6) { c.fillStyle = `rgba(250,248,255,${1 - E.outC(seg(t, 0, 0.6))})`; c.fillRect(0, 0, W, H); }
      // prism: a white beam enters, a spectrum fans out and sweeps the letters
      const pa = seg(t, HO_T.prism, HO_T.prism + 0.35) * (1 - seg(t, 7.5, 8.1));
      if (pa > 0) {
        const px = 960, py = 118, pr = 58, rot = 0.15 * Math.sin(t * 1.4);
        c.save();
        c.globalCompositeOperation = 'source-over';
        const bg = c.createLinearGradient(420, -20, px, py); bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(1, `rgba(255,255,255,${0.85 * pa})`);
        c.strokeStyle = bg; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(420, -20); c.lineTo(px - 20, py); c.stroke();
        const base = lerp(1.95, 0.95, E.ioS(seg(t, HO_T.prism, 7.6))), spec = ['#ff3b5c', '#ff9a3b', '#ffe94a', '#4dff8a', '#3bc8ff', '#5b6bff', '#b35bff'];
        spec.forEach((col, k) => {
          const a0 = base + (k - 3.5) * 0.065, a1 = a0 + 0.065, Lf = 1250;
          const gr = c.createRadialGradient(px + 20, py, 0, px + 20, py, Lf);
          gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
          c.globalAlpha = 0.4 * pa; c.fillStyle = gr;
          c.beginPath(); c.moveTo(px + 20, py); c.lineTo(px + 20 + Math.cos(a0) * Lf, py + Math.sin(a0) * Lf); c.lineTo(px + 20 + Math.cos(a1) * Lf, py + Math.sin(a1) * Lf); c.closePath(); c.fill();
        });
        c.restore();
        // the glass prism itself
        c.save(); c.globalAlpha = pa; c.translate(px, py); c.rotate(rot);
        c.beginPath(); for (let k = 0; k < 3; k++) { const a = -PI / 2 + k * TAU / 3; k ? c.lineTo(Math.cos(a) * pr, Math.sin(a) * pr) : c.moveTo(Math.cos(a) * pr, Math.sin(a) * pr); } c.closePath();
        const pg = c.createLinearGradient(-pr, -pr, pr, pr); pg.addColorStop(0, 'rgba(255,255,255,0.75)'); pg.addColorStop(0.5, 'rgba(230,220,255,0.25)'); pg.addColorStop(1, 'rgba(255,255,255,0.6)');
        c.fillStyle = pg; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
        c.restore();
      }
      // foil stickers slap down around the type
      hoSticker(c, t, HO_T.st[0], 300, 236, -0.18, 'star', 112, null);
      hoSticker(c, t, HO_T.st[1], 1636, 226, 0.12, 'circle', 104, [['NEW', -18, 34], ['WAVE', 22, 34]]);
      hoSticker(c, t, HO_T.st[2], 1700, 846, 0.2, 'bolt', 118, null);
      hoChip(c, '01 · HOLOGRAPHIC FOIL', t, 0.45, 2.05);
      hoChip(c, '02 · LIQUID CHROME', t, 2.35, 4.6);
      hoChip(c, '03 · BLOB TYPE', t, 4.85, 6.15);
      hoChip(c, '04 · PRISM + STICKERS', t, 6.25, HO_T.title);
      if (t > HO_T.title) {
        const u = E.outQt(seg(t, HO_T.title, HO_T.title + 0.7)), v = E.outC(seg(t, HO_T.sub, HO_T.sub + 0.6));
        c.save(); c.globalAlpha = u;
        text(c, 'Holographic', 110, 958 + (1 - u) * 24, { font: UNB, weight: 800, size: 78, color: HO.ink, ls: 1 });
        c.globalAlpha = v;
        text(c, 'Thin-film Foil and Liquid Chrome', 114, 1012 + (1 - v) * 14, { font: SG, weight: 500, size: 30, color: HO.dim, ls: 1 });
        c.restore();
      }
      grain(c, W, H, t, 0.03, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const T = HO_T;
      // dreamy pad: Fmaj9 → Am7 → Bbmaj7 → C6/9 → Fmaj9, soft-attack detuned triangles
      const pad = (t, notes, dur, g = 0.022) => A.chord(t, notes, { type: 'triangle', dur, g, a: 0.6, hold: true, rel: 0.8, lp: 2200, spread: 7, width: 0.9, rev: 0.5 });
      pad(0, [53, 57, 60, 64, 67], 2.3); pad(2.1, [45, 57, 60, 64, 67], 2.4); pad(4.35, [46, 58, 62, 65, 69], 1.7); pad(5.9, [48, 57, 62, 64, 67], 2.1); pad(T.title, [41, 53, 57, 60, 64, 67], 2.15, 0.026);
      // foil crinkle: sparse bright ticks while the sheet tilts
      for (let k = 0; k < 26; k++) { const tt = 0.1 + hash(k * 3.1) * 1.9; A.noise(tt, { type: 'highpass', f: 5000 + hash(k) * 4000, dur: 0.015 + hash(k * 7) * 0.02, g: 0.025 + hash(k * 5) * 0.03, pan: hash(k * 9) - 0.5 }); }
      // shimmer arpeggio over the foil
      const arp = [84, 88, 91, 95, 96, 91, 88, 86];
      for (let k = 0; k < 8; k++) A.bell(0.2 + k * 0.24, midi(arp[k]), { g: 0.022, dur: 0.9, ratios: [1, 2.01, 3.98], rev: 0.55, pan: Math.sin(k * 1.7) * 0.6 });
      // the drop rising: a liquid bloop, then bubbly merges and splits as the beads orbit
      A.osc(T.drop, { f: 180, f2: 620, glide: 0.5, dur: 0.6, g: 0.07, rev: 0.35 });
      A.osc(T.drop + 0.7, { f: 300, f2: 220, glide: 0.2, dur: 0.3, g: 0.04, vib: [9, 12] });
      [3.0, 3.22, 3.5, 3.71, 3.95, 4.18, 4.5, 4.7].forEach((tt, k) => { const f = 320 + hash(k * 13) * 380; A.osc(tt, { f, f2: f * (k % 2 ? 1.8 : 0.6), glide: 0.09, dur: 0.14, g: 0.045, rev: 0.3, pan: k % 2 ? 0.45 : -0.45 }); });
      // morph into type: a soft riser and a velvet impact
      A.riser(T.gather + 0.25, T.morphE - T.gather - 0.25, { g: 0.07, f: 87 });
      A.impact(T.morphE, 0.28, { rev: 0.6 });
      A.osc(T.morphE, { f: midi(41), dur: 1.6, g: 0.12, a: 0.01 });
      // a slow half-time beat under the prism section
      for (let k = 0; k < 4; k++) { const tt = 6.0 + k * 0.48; A.kick(tt, 0.32, { f: 120, f2: 45 }); A.hat(tt + 0.24, 0.035, k % 2 === 1, { pan: 0.3 }); }
      A.whoosh(T.prism, 1.4, { f1: 500, f2: 7000, g: 0.06, swell: 0.5, rev: 0.5 });
      // sticker slaps: a crisp snap and a glitter twinkle each
      T.st.forEach((tt, k) => {
        A.noise(tt + 0.05, { type: 'bandpass', f: 2600, q: 1.5, dur: 0.05, g: 0.12 });
        A.osc(tt + 0.05, { type: 'triangle', f: 520, f2: 260, glide: 0.05, dur: 0.08, g: 0.06 });
        [0, 0.06, 0.12].forEach((d, j) => A.bell(tt + 0.32 + d, midi(91 + k * 2 + j * 5), { g: 0.02, dur: 0.6, ratios: [1, 2.76], rev: 0.5, pan: (k - 1) * 0.5 }));
      });
      // title: glassy bell cascade over the final chord
      [77, 81, 84, 88, 91, 96].forEach((m, i) => A.bell(T.title + 0.05 + i * 0.09, midi(m), { g: 0.03, dur: 1.6, rev: 0.6, pan: (i - 2.5) * 0.22 }));
      A.osc(T.title, { f: midi(29), dur: 2.1, g: 0.1, a: 0.05, hold: true, rel: 1.0 });
    },
  });

  /* =====================================================================
     POINT CLOUD / LIDAR — a dark frame and a spinning sensor on a car:
     22 laser rings sweep out and the street is written in points as it
     drives, every return flashing on arrival; the camera cranes up off
     the car into a slow orbit, a scan plane rises through the city and
     re-colours it by range; then the cloud comes apart like the House of
     Cards video, drifting into noise, and snaps back for the title
     ===================================================================== */
  const PC = { ink: '#e6f0ff', dim: 'rgba(150,170,200,0.75)', faint: 'rgba(120,140,170,0.45)', accent: '#3fe0ff' };
  const PC_T = { scan0: 0.4, scan1: 6.0, sw0: 3.6, sw1: 5.2, dis0: 6.35, dis1: 8.25, title: 8.4, sub: 8.8 };
  const PC_NR = 46, PC_NB = 22, PC_NA = 320, PC_RANGE = 55, PC_SZ = -2.1, PC_SH = 2.05, PC_W = 1920, PC_H = 1080;
  const pcRad = t => kf(t, [[0, 16], [2.6, 17], [6.0, 34, E.ioS], [10, 41, E.outQ]]);
  const pcCarX = t => lerp(-38, 12, seg(t, PC_T.scan0, PC_T.scan1));
  function pcCam(t) {
    const tx = t < 2.6 ? pcCarX(t) + 8 : lerp(pcCarX(2.6) + 8, -10, E.ioS(seg(t, 2.6, 6.6)));
    const ty = kf(t, [[0, 1.4], [2.6, 1.6], [6.6, 1.2, E.ioS]]), tz = kf(t, [[0, PC_SZ], [2.6, PC_SZ], [6.6, 0, E.ioS]]);
    const az = kf(t, [[0, -1.7], [2.6, -1.58, E.lin], [6.0, -0.62, E.ioS], [10, 0.08, E.outQ]]);
    const el = kf(t, [[0, 0.1], [2.6, 0.12], [6.0, 0.42, E.ioS], [10, 0.5, E.outQ]]);
    const r = pcRad(t);
    const e = [tx + r * Math.cos(el) * Math.sin(az), ty + r * Math.sin(el), tz + r * Math.cos(el) * Math.cos(az)];
    const w = [tx - e[0], ty - e[1], tz - e[2]], wl = Math.hypot(w[0], w[1], w[2]); w[0] /= wl; w[1] /= wl; w[2] /= wl;
    const u = [-w[2], 0, w[0]], ul = Math.hypot(u[0], u[2]); u[0] /= ul; u[2] /= ul;
    const v = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    return { e, u, v, w, f: 1120, cx: PC_W / 2, cy: PC_H / 2 };
  }
  const pcProj = (C, x, y, z) => {
    const dx = x - C.e[0], dy = y - C.e[1], dz = z - C.e[2];
    const X = dx * C.u[0] + dy * C.u[1] + dz * C.u[2], Y = dx * C.v[0] + dy * C.v[1] + dz * C.v[2], Z = dx * C.w[0] + dy * C.w[1] + dz * C.w[2];
    return [C.cx + C.f * X / Z, C.cy - C.f * Y / Z, Z];
  };
  // Turbo-style range palette (Google’s polynomial fit).
  function pcTurbo(x) {
    x = clamp(x);
    return [
      0.13572138 + x * (4.6153926 + x * (-42.66032258 + x * (132.13108234 + x * (-152.94239396 + x * 59.28637943)))),
      0.09140261 + x * (2.19418839 + x * (4.84296658 + x * (-14.18503333 + x * (4.27729857 + x * 2.82956604)))),
      0.1066733 + x * (12.64194608 + x * (-60.58204836 + x * (110.36276771 + x * (-89.90310912 + x * 27.34824973)))),
    ];
  }
  const pack = (r, g, b) => (255 << 24) | (clamp(b) * 255 << 16) | (clamp(g) * 255 << 8) | (clamp(r) * 255 | 0);
  // The street: boxes [x0,y0,z0,x1,y1,z1,mat,refl], vertical cylinders [x,z,r,y0,y1,mat,refl], spheres [x,y,z,r,mat,refl].
  function pcStreet() {
    const r = rng(2008), B = [], CY = [], SP = [];
    for (const side of [-1, 1]) {
      let x = -78;
      while (x < 52) {
        const w = 7 + r() * 9, h = 6 + r() * 19, z0 = 9 + (r() < 0.3 ? 0.8 + r() * 2.2 : 0), rf = 0.42 + r() * 0.4;
        B.push(side > 0 ? [x, 0, z0, x + w, h, z0 + 14, 3, rf] : [x, 0, -z0 - 14, x + w, h, -z0, 3, rf]);
        if (r() < 0.45) { const iw = w * (0.4 + r() * 0.4), ix = x + (w - iw) * r(); B.push(side > 0 ? [ix, h, z0 + 2, ix + iw, h + 1.5 + r() * 2.5, z0 + 9, 3, rf] : [ix, h, -z0 - 9, ix + iw, h + 1.5 + r() * 2.5, -z0 - 2, 3, rf]); }
        x += w + (r() < 0.22 ? 1.6 + r() * 2.5 : 0.05);
      }
    }
    // parked cars: body + cabin
    for (const side of [-1, 1]) {
      let x = -70 + r() * 6;
      while (x < 45) {
        if (r() < 0.75) {
          const z = side * 4.75, L = 4.1 + r() * 0.7, rf = 0.55 + r() * 0.4;
          B.push([x, 0.28, z - 0.9, x + L, 1.0, z + 0.9, 5, rf]);
          B.push([x + L * 0.24, 1.0, z - 0.76, x + L * 0.78, 1.48, z + 0.76, 6, 0.25]);
        }
        x += 5.4 + r() * 2.5;
      }
    }
    // street trees, lamp posts, a few pedestrians
    for (const side of [-1, 1]) for (let x = -66 + (side > 0 ? 4 : 0); x < 48; x += 11 + r() * 3) {
      CY.push([x, side * 7.6, 0.2, 0, 3.4, 7, 0.4]);
      SP.push([x, 4.7 + r() * 0.6, side * 7.6, 2.0 + r() * 0.7, 8, 0.45]);
    }
    for (const side of [-1, 1]) for (let x = -60 + (side > 0 ? 7 : 0); x < 48; x += 16) {
      CY.push([x, side * 6.4, 0.09, 0, 6.6, 9, 0.85]);
      B.push([x - 0.2, 6.5, side * 6.4 - (side > 0 ? 1.4 : -0.1) - 0.1, x + 0.2, 6.75, side * 6.4 + (side > 0 ? 0.1 : 1.4), 9, 0.85]);
    }
    [[-22, 7.0], [-4, -7.3], [18, 6.8], [-41, -7.0]].forEach(([x, z]) => { CY.push([x, z, 0.24, 0.15, 1.5, 10, 0.5]); SP.push([x, 1.66, z, 0.14, 10, 0.5]); });
    return { B, CY, SP };
  }
  // Cast every laser ray of every revolution against the street; returns the cloud sorted by arrival time.
  function pcScan() {
    const { B, CY, SP } = pcStreet(), r = rng(1101);
    const X = [], Y = [], Z = [], T = [], I = [];
    const dt = (PC_T.scan1 - PC_T.scan0) / PC_NR;
    const el = []; for (let b = 0; b < PC_NB; b++) { const u = b / (PC_NB - 1); el.push((-25 + 40 * Math.pow(u, 1.15)) * PI / 180); }
    for (let k = 0; k < PC_NR; k++) {
      const ox0 = pcCarX(PC_T.scan0 + k * dt);
      const bl = B.filter(b => b[3] > ox0 - PC_RANGE - 3 && b[0] < ox0 + PC_RANGE + 3), cl = CY.filter(q => Math.abs(q[0] - ox0) < PC_RANGE + 3), sl = SP.filter(q => Math.abs(q[0] - ox0) < PC_RANGE + 3);
      for (let j = 0; j < PC_NA; j++) {
        const tp = PC_T.scan0 + (k + j / PC_NA) * dt, ox = pcCarX(tp), oy = PC_SH, oz = PC_SZ;
        const az = (j / PC_NA) * TAU + k * 0.41;
        const ca = Math.cos(az), sa = Math.sin(az);
        for (let b = 0; b < PC_NB; b++) {
          const ce = Math.cos(el[b]), dx = ce * ca, dy = Math.sin(el[b]), dz = ce * sa;
          const ix = 1 / (dx || 1e-9), iy = 1 / (dy || 1e-9), iz = 1 / (dz || 1e-9);
          let tb = PC_RANGE, mat = -1, ax = 0, nx = 0, ny = 1, nz = 0, rf = 0, obj = null;
          if (dy < 0) {
            const t0 = -oy * iy, hz = oz + dz * t0;
            if (Math.abs(hz) < 6) { if (t0 < tb) { tb = t0; mat = 0; rf = 0.3; ny = 1; } }
            else { const t1 = (0.15 - oy) * iy, hz1 = oz + dz * t1; if (Math.abs(hz1) >= 6 && t1 < tb) { tb = t1; mat = 1; rf = 0.58; ny = 1; } }
          }
          for (let q = 0; q < bl.length; q++) {
            const o = bl[q];
            let t1 = (o[0] - ox) * ix, t2 = (o[3] - ox) * ix, tmin = Math.min(t1, t2), tmax = Math.max(t1, t2), a = 0;
            t1 = (o[1] - oy) * iy; t2 = (o[4] - oy) * iy; let m1 = Math.min(t1, t2), m2 = Math.max(t1, t2);
            if (m1 > tmin) { tmin = m1; a = 1; } if (m2 < tmax) tmax = m2;
            t1 = (o[2] - oz) * iz; t2 = (o[5] - oz) * iz; m1 = Math.min(t1, t2); m2 = Math.max(t1, t2);
            if (m1 > tmin) { tmin = m1; a = 2; } if (m2 < tmax) tmax = m2;
            if (tmax >= tmin && tmin > 0.3 && tmin < tb) { tb = tmin; mat = o[6]; rf = o[7]; ax = a; obj = o; }
          }
          for (let q = 0; q < cl.length; q++) {
            const o = cl[q], px = ox - o[0], pz = oz - o[1], A2 = dx * dx + dz * dz, Bq = px * dx + pz * dz, Cq = px * px + pz * pz - o[2] * o[2], disc = Bq * Bq - A2 * Cq;
            if (disc <= 0) continue;
            const tt = (-Bq - Math.sqrt(disc)) / A2, yy = oy + dy * tt;
            if (tt > 0.3 && tt < tb && yy >= o[3] && yy <= o[4]) { tb = tt; mat = o[5]; rf = o[6]; ax = 3; obj = o; }
          }
          for (let q = 0; q < sl.length; q++) {
            const o = sl[q], px = ox - o[0], py = oy - o[1], pz = oz - o[2], Bq = px * dx + py * dy + pz * dz, Cq = px * px + py * py + pz * pz - o[3] * o[3], disc = Bq * Bq - Cq;
            if (disc <= 0) continue;
            const tt = -Bq - Math.sqrt(disc);
            if (tt > 0.3 && tt < tb) { tb = tt; mat = o[4]; rf = o[5]; ax = 4; obj = o; }
          }
          if (mat < 0) continue;
          let hx = ox + dx * tb, hy = oy + dy * tb, hz = oz + dz * tb;
          // incidence for the return strength
          if (ax === 0 && mat > 1) { nx = 1; ny = 0; nz = 0; } else if (ax === 1) { nx = 0; ny = 1; nz = 0; } else if (ax === 2) { nx = 0; ny = 0; nz = 1; }
          else if (ax === 3) { nx = hx - obj[0]; ny = 0; nz = hz - obj[1]; } else if (ax === 4) { nx = hx - obj[0]; ny = hy - obj[1]; nz = hz - obj[2]; }
          const nl = Math.hypot(nx, ny, nz) || 1, inc = Math.abs((nx * dx + ny * dy + nz * dz) / nl);
          if (mat === 0) {
            // lane paint and a zebra crossing return brighter than asphalt
            const az2 = Math.abs(hz);
            if ((az2 < 0.12 && ((hx % 6) + 6) % 6 < 3) || (az2 > 5.55 && az2 < 5.7) || (hx > -9 && hx < -5.5 && az2 < 5.4 && ((az2 / 0.9) % 1) < 0.5)) rf = 0.95;
          } else if (mat === 3 && ax !== 1) {
            // facades: recessed windows; glass swallows most returns
            const u = ax === 2 ? hx : hz, fl = hy / 3.2, fu = (((u / 2.7) % 1) + 1) % 1, fv = fl % 1;
            const shop = hy < 3.4 && hy > 0.45 && ((((u / 5.5) % 1) + 1) % 1) > 0.1 && ((((u / 5.5) % 1) + 1) % 1) < 0.85;
            if (shop || (hy > 3.6 && fu > 0.22 && fu < 0.78 && fv > 0.3 && fv < 0.86)) {
              if (r() < 0.68) continue;
              const back = 0.4 / Math.max(0.2, inc); hx += dx * back; hy += dy * back; hz += dz * back; rf = 0.14;
            }
          } else if (mat === 8) {
            // foliage: a fuzzy volume, not a shell
            if (r() < 0.18) continue;
            const dd = r() * r() * 1.6; hx += dx * dd + (r() - 0.5) * 0.3; hy += dy * dd + (r() - 0.5) * 0.3; hz += dz * dd + (r() - 0.5) * 0.3;
          }
          X.push(hx); Y.push(hy); Z.push(hz); T.push(tp);
          I.push(clamp(rf * (0.4 + 0.6 * inc) * (1 - 0.35 * tb / PC_RANGE) + (r() - 0.5) * 0.08));
        }
      }
    }
    const n = X.length, P = { n, x: new Float32Array(X), y: new Float32Array(Y), z: new Float32Array(Z), t: new Float32Array(T), i: new Float32Array(I), q: new Float32Array(n), q2: new Float32Array(n) };
    for (let k = 0; k < n; k++) { P.q[k] = r(); P.q2[k] = r(); }
    return P;
  }
  const pcUpper = (a, n, v) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m + 1; else hi = m; } return lo; };
  const pcFmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  MG.film({
    id: 'pointcloud', dur: 10, poster: 9.4,
    fonts: [['700 104px "Inter Tight"', 'Point Cloud'], ['500 30px "Inter Tight"', 'LiDAR Scans, Millions of Points'], ['400 20px "IBM Plex Mono"', 'LIDARSWEPCNHZM0123456789·,/—RANGEINTSYPOX'], ['500 40px "IBM Plex Mono"', '0123456789,']],
    meta: {
      family: 'D', name: 'Point Cloud', sub: 'LiDAR Scans, Millions of Points', era: '2008 —',
      origin: 'The world shown as it is measured: millions of laser returns from LiDAR scanners or photogrammetry drawn as bare points, with no surfaces between them, coloured by intensity, height or range. Radiohead’s “House of Cards” video (James Frost, 2008), shot with a Velodyne scanner and structured light instead of cameras, made the look famous; survey-grade scans of cities and ruins by studios such as ScanLAB Projects, the self-driving-car sensor view and, since 2023, Gaussian-splat captures have kept it the visual shorthand for machine vision.',
      works: 'House of Cards (Radiohead, dir. James Frost, 2008) · Rome’s Invisible City (ScanLAB Projects for BBC One, 2015) · 3D Gaussian Splatting for Real-Time Radiance Field Rendering (Kerbl, Kopanas, Leimkühler & Drettakis, SIGGRAPH 2023)',
      tech: ['Ray-cast spinning 22-beam LiDAR', 'Arrival-time reveal of 200k points', 'z-buffered point splats, range colour'],
      accent: '#3fe0ff',
      motionDNA: 'The image accumulates rather than moves: rings of returns sweep out ten times a second from a travelling sensor, each point flashing white as it lands and cooling into its colour, while a slow camera crane and orbit lets the parallax prove the space is real; a scan plane re-colours the city as it rises, and the whole cloud can drift apart like sand and snap back.',
      visualDNA: 'Black void, no surfaces, only points: concentric laser rings on the road, striped facades with holes where glass ate the beam, fuzzy trees and shadowed voids behind every object; cold intensity greys and cyans switch to a rainbow range ramp; thin monospaced HUD readouts, point counts and a laser fan from the sensor.',
      transitions: 'Black → sensor sweep reveal → crane up into orbit → rising scan plane recolours by range → House-of-Cards dissolve → cloud reassembles under the title',
      implementation: ['Velodyne / Ouster LiDAR + CloudCompare / Potree', 'Houdini or TouchDesigner point instancing', 'Gaussian-splat viewers (3DGS, Luma, Polycam)', 'Canvas 2D: ray-cast scan in setup, per-frame z-buffered point splats into ImageData'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const P = pcScan(), cv = offscreen(PC_W, PC_H), g = cv.getContext('2d'), img = g.createImageData(PC_W, PC_H);
      const N = PC_W * PC_H, bg = new Uint32Array(N);
      for (let y = 0; y < PC_H; y++) {
        const u = y / PC_H, row = pack(0.012 + 0.02 * u, 0.018 + 0.03 * u, 0.03 + 0.05 * u);
        bg.fill(row, y * PC_W, (y + 1) * PC_W);
      }
      // palettes × 8 fog levels: intensity (cold grey-cyan) and range (turbo)
      const lutI = new Uint32Array(8 * 256), lutR = new Uint32Array(8 * 256);
      for (let f = 0; f < 8; f++) {
        const k = Math.pow(1 - f / 8.5, 1.3);
        for (let i = 0; i < 256; i++) {
          const v = i / 255, a = 0.1 + 0.9 * Math.pow(v, 0.8);
          lutI[f * 256 + i] = pack(a * (0.55 + 0.4 * v) * k, a * (0.8 + 0.2 * v) * k, a * 1.0 * k);
          const c = pcTurbo(0.06 + 0.9 * v); lutR[f * 256 + i] = pack(c[0] * k, c[1] * k, c[2] * k);
        }
      }
      return { P, cv, g, img, u32: new Uint32Array(img.data.buffer), zb: new Float32Array(N), bg, lutI, lutR };
    },
    draw(c, t, W, H, st) {
      const P = st.P, C = pcCam(t), u32 = st.u32, zb = st.zb, lutI = st.lutI, lutR = st.lutR;
      u32.set(st.bg); zb.fill(1e9);
      const n = pcUpper(P.t, P.n, t);
      const e0 = C.e[0], e1 = C.e[1], e2 = C.e[2], u0 = C.u[0], u2 = C.u[2], v0 = C.v[0], v1 = C.v[1], v2 = C.v[2], w0 = C.w[0], w1 = C.w[1], w2 = C.w[2], f = C.f, cx = C.cx, cy = C.cy;
      // rising scan plane: below it, colour by range
      const rc = pcRad(t), zn = Math.max(0, rc - 24), zs = Math.min(62, rc + 22);
      const plane = lerp(-1.5, 32, E.ioS(seg(t, PC_T.sw0, PC_T.sw1)));
      const FRESH = pack(0.85, 1, 1), LINE = pack(0.75, 1, 1);
      // House of Cards: the cloud drifts apart from one end and comes back
      const dis = Math.sin(PI * E.ioS(seg(t, PC_T.dis0, PC_T.dis1))), dph = t * 1.7;
      const px = P.x, py = P.y, pz = P.z, pt = P.t, pi = P.i, pq = P.q, pq2 = P.q2;
      for (let k = 0; k < n; k++) {
        let x = px[k], y = py[k], z = pz[k];
        if (dis > 0.001) {
          const lw = clamp(dis * 1.6 - (0.5 - x / 140) * 0.9 - pq[k] * 0.25), l2 = lw * lw;
          if (l2 > 0) {
            x += l2 * (6 + 10 * pq[k]) + lw * 1.6 * Math.sin(y * 0.6 + dph + pq2[k] * 3);
            y += l2 * (pq2[k] - 0.3) * 7 + lw * 0.8 * Math.sin(x * 0.3 + dph);
            z += l2 * (pq[k] - 0.5) * 9;
          }
        }
        const dx = x - e0, dy = y - e1, dz = z - e2;
        const Z = dx * w0 + dy * w1 + dz * w2;
        if (Z < 0.6) continue;
        const iz = f / Z, sx = (cx + (dx * u0 + dz * u2) * iz) | 0, sy = (cy - (dx * v0 + dy * v1 + dz * v2) * iz) | 0;
        if (sx < 0 || sy < 0 || sx >= PC_W - 2 || sy >= PC_H - 2) continue;
        const age = t - pt[k], zr = Z - zn, fl = zr < 0 ? 0 : zr < 84 ? (zr / 12) | 0 : 7;
        let col, sz = Z < 11 ? 3 : Z < 34 ? 2 : 1;
        if (age < 0.12) { col = FRESH; sz = Math.min(3, sz + 1); }
        else if (Math.abs(py[k] - plane) < 0.22 && plane > -1 && plane < 31) col = LINE;
        else if (py[k] < plane) col = lutR[fl * 256 + (clamp(zr / zs) * 255 | 0)];
        else col = lutI[fl * 256 + (pi[k] * 255 | 0)];
        let p = sy * PC_W + sx;
        if (sz === 1) { if (Z < zb[p]) { zb[p] = Z; u32[p] = col; } }
        else for (let yy = 0; yy < sz; yy++, p += PC_W) for (let xx = 0; xx < sz; xx++) if (Z < zb[p + xx]) { zb[p + xx] = Z; u32[p + xx] = col; }
      }
      st.g.putImageData(st.img, 0, 0);
      c.drawImage(st.cv, 0, 0, W, H);
      // the sensor: wire box of the car, the spinning puck and its laser fan to the latest returns
      const carA = (1 - seg(t, PC_T.dis0 - 0.3, PC_T.dis0 + 0.2));
      if (carA > 0) {
        const sx = pcCarX(t), x0 = sx - 2.3, x1 = sx + 2.1, y0 = 0.3, y1 = 1.55, z0 = PC_SZ - 0.9, z1 = PC_SZ + 0.9;
        const V = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]].map(p => pcProj(C, p[0], p[1], p[2]));
        c.save(); c.globalAlpha = carA;
        if (V.every(p => p[2] > 0.5)) {
          c.strokeStyle = 'rgba(63,224,255,0.75)'; c.lineWidth = 1.5; c.beginPath();
          [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => { c.moveTo(V[a][0], V[a][1]); c.lineTo(V[b][0], V[b][1]); });
          c.stroke();
        }
        const S = pcProj(C, sx, PC_SH, PC_SZ);
        if (S[2] > 0.5 && t > PC_T.scan0 && t < PC_T.scan1) {
          const a = pcUpper(P.t, P.n, t - 0.03);
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(63,224,255,0.07)'; c.lineWidth = 1; c.beginPath();
          for (let k = a; k < n; k += 3) { const q = pcProj(C, px[k], py[k], pz[k]); if (q[2] > 0.5) { c.moveTo(S[0], S[1]); c.lineTo(q[0], q[1]); } }
          c.stroke();
          const g = c.createRadialGradient(S[0], S[1], 0, S[0], S[1], 40); g.addColorStop(0, 'rgba(180,250,255,0.9)'); g.addColorStop(1, 'rgba(63,224,255,0)');
          c.fillStyle = g; c.beginPath(); c.arc(S[0], S[1], 40, 0, TAU); c.fill();
        }
        c.restore();
      }
      // HUD
      const hud = seg(t, 0.05, 0.4) * (1 - 0.6 * seg(t, PC_T.title - 0.3, PC_T.title + 0.3));
      c.save(); c.globalAlpha = hud;
      const rev = Math.min(PC_NR, Math.max(0, Math.floor((t - PC_T.scan0) / ((PC_T.scan1 - PC_T.scan0) / PC_NR)) + 1));
      text(c, 'LIDAR SWEEP — STREET_07', 72, 84, { font: MONO, weight: 500, size: 22, color: PC.ink, ls: 3 });
      text(c, `${PC_NB} CH · 10 HZ · ${PC_RANGE} M · REV ${String(rev).padStart(2, '0')}/${PC_NR}`, 72, 116, { font: MONO, size: 19, color: PC.dim, ls: 2 });
      text(c, pcFmt(n), W - 72, 92, { font: MONO, weight: 500, size: 40, color: PC.ink, align: 'right', ls: 1 });
      text(c, 'POINTS', W - 72, 124, { font: MONO, size: 19, color: PC.dim, align: 'right', ls: 4 });
      // colour legend
      const lg = seg(t, PC_T.sw0, PC_T.sw0 + 0.4);
      const ly = 1006;
      if (lg < 1) { c.globalAlpha = hud * (1 - lg) * (1 - seg(t, PC_T.title - 0.4, PC_T.title)); text(c, 'COLOUR · RETURN INTENSITY', 72, ly, { font: MONO, size: 19, color: PC.dim, ls: 2 }); }
      if (lg > 0) {
        c.globalAlpha = hud * lg * (1 - seg(t, PC_T.title - 0.4, PC_T.title));
        text(c, 'COLOUR · RANGE 0 — 60 M', 72, ly, { font: MONO, size: 19, color: PC.dim, ls: 2 });
        const gx = 470, gr = c.createLinearGradient(gx, 0, gx + 260, 0);
        for (let k = 0; k <= 8; k++) { const q = pcTurbo(0.06 + 0.9 * k / 8); gr.addColorStop(k / 8, `rgb(${q.map(v => Math.round(clamp(v) * 255)).join(',')})`); }
        c.fillStyle = gr; c.fillRect(gx, ly - 13, 260, 8);
      }
      // axis gizmo
      c.globalAlpha = hud;
      const ox = W - 110, oy = 990;
      [[[1, 0, 0], '#ff5a6a', 'X'], [[0, 1, 0], '#6dff9a', 'Y'], [[0, 0, 1], '#5ab4ff', 'Z']].forEach(([a, col, s]) => {
        const X = a[0] * C.u[0] + a[1] * C.u[1] + a[2] * C.u[2], Y = a[0] * C.v[0] + a[1] * C.v[1] + a[2] * C.v[2];
        c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + X * 46, oy - Y * 46); c.stroke();
        text(c, s, ox + X * 60, oy - Y * 60 + 7, { font: MONO, size: 17, color: col, align: 'center' });
      });
      if (dis > 0.15) { c.globalAlpha = hud * clamp(dis * 2 - 0.3); text(c, 'DECIMATE · DRIFT', W / 2, 1006, { font: MONO, size: 19, color: PC.accent, align: 'center', ls: 4 }); }
      c.restore();
      if (t > PC_T.title) {
        const u = E.outQt(seg(t, PC_T.title, PC_T.title + 0.7)), v = E.outC(seg(t, PC_T.sub, PC_T.sub + 0.6));
        c.save(); c.globalAlpha = u;
        c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 30;
        text(c, 'Point Cloud', 104, 952 + (1 - u) * 20, { font: TIGHT, weight: 700, size: 104, color: PC.ink, ls: -1 });
        c.globalAlpha = v;
        text(c, 'LiDAR Scans, Millions of Points', 110, 1008 + (1 - v) * 12, { font: TIGHT, weight: 500, size: 30, color: PC.accent, ls: 1 });
        c.restore();
      }
      vignette(c, W, H, 0.45);
      grain(c, W, H, t, 0.035, 'screen');
    },
    score(A) {
      A.bus.gain.value = 0.95;
      const T = PC_T, dt = (T.scan1 - T.scan0) / PC_NR;
      // low drone: a filtered saw fifth and a sine floor
      A.osc(0, { type: 'sawtooth', f: midi(26), dur: 10, g: 0.045, a: 1.2, hold: true, rel: 1.2, lp: 260, rev: 0.3 });
      A.osc(0, { type: 'sawtooth', f: midi(33), detune: 6, dur: 8.3, g: 0.03, a: 1.5, hold: true, rel: 1.4, lp: 320 });
      A.osc(0, { f: midi(38), dur: 10, g: 0.05, a: 0.8, hold: true, rel: 1.0 });
      // the sensor: a whining motor and a tick on every revolution
      A.osc(T.scan0, { type: 'triangle', f: 1180, dur: T.scan1 - T.scan0, g: 0.008, a: 0.4, hold: true, rel: 0.4, vib: [10, 40], pan: -0.2 });
      for (let k = 0; k < PC_NR; k++) { const tt = T.scan0 + k * dt; A.hat(tt, k % 4 ? 0.018 : 0.035, false, { f: 9000, pan: Math.sin(k * 0.6) * 0.6 }); }
      // data pings as each block of returns lands
      for (let k = 0; k < 12; k++) A.bell(T.scan0 + 0.2 + k * 0.45, midi([86, 93, 89, 98, 91, 86, 95, 89, 93, 98, 86, 91][k]), { g: 0.016, dur: 0.6, ratios: [1, 2.4], rev: 0.5, pan: (hash(k * 5) - 0.5) * 1.2 });
      // a muted, rolling guitar figure in the spirit of the reference
      const fig = [62, 69, 74, 77, 76, 69, 72, 65];
      for (let k = 0; k < 20; k++) { const tt = 1.6 + k * 0.24; if (tt > T.dis0 + 0.2) break; A.pluck(tt, midi(fig[k % 8] - (k >= 8 && k < 16 ? 2 : 0)), { g: 0.085, dur: 1.0, bright: 0.45, decay: 0.993, lp: 2400, rev: 0.4, pan: k % 2 ? 0.3 : -0.3 }); }
      [[1.6, 38], [3.52, 36], [5.44, 41]].forEach(([tt, m]) => A.pluck(tt, midi(m), { g: 0.16, dur: 1.8, bright: 0.35, decay: 0.996 }));
      for (let k = 0; k < 6; k++) A.kick(1.6 + k * 0.96, 0.22, { f: 90, f2: 38, dur: 0.5 });
      // the range plane rising
      A.riser(T.sw0, T.sw1 - T.sw0, { g: 0.05, f: 73 });
      // dissolve: granular crushed grains and a falling tone
      for (let k = 0; k < 40; k++) { const tt = T.dis0 + 0.1 + k * 0.042; A.noise(tt, { type: 'bandpass', f: 600 + hash(k * 7) * 5000, q: 6, dur: 0.03, g: 0.035 * Math.sin(PI * k / 40) + 0.01, crush: true, pan: hash(k * 3) - 0.5 }); }
      A.noise(T.dis0, { type: 'bandpass', f: 1800, f2: 300, q: 1.2, dur: 1.8, g: 0.06, swell: 0.5, rev: 0.6 });
      A.osc(T.dis0 + 0.2, { type: 'sawtooth', f: midi(62), f2: midi(50), glide: 1.4, dur: 1.5, g: 0.02, lp: 1200, vib: [5, 6], rev: 0.5 });
      // reassembly and title: a hit and a Dm(add9) bloom
      A.impact(T.dis1, 0.35, { rev: 0.6 });
      A.chord(T.dis1, [50, 57, 62, 64, 65, 69], { type: 'triangle', dur: 1.75, g: 0.026, a: 0.15, hold: true, rel: 0.9, lp: 2600, spread: 6, width: 0.9, rev: 0.6 });
      [74, 81, 86, 88].forEach((m, i) => A.bell(T.title + i * 0.14, midi(m), { g: 0.028, dur: 1.4, rev: 0.6, pan: (i - 1.5) * 0.3 }));
    },
  });

  /* =====================================================================
     CORPORATE MEMPHIS — pastel blobs and squiggles pop onto a cream
     page and a giant app window springs up; three big-limbed, tiny-
     headed teammates arrive: one climbs a ladder and slots a photo card
     into the layout, one rides a growing bar chart with a laptop, one
     carries a giant cursor, flips the toggle and hits Launch; hearts
     burst, everyone cheers, and the camera pulls back to a friendly
     lockup for a fictional workplace app
     ===================================================================== */
  const CM = { bg: '#fbf3ec', ink: '#1f2150', soft: '#5c5f8a', lav: '#d9cfff', lav2: '#f0ebff', peach: '#ffd2c0', mint: '#c2eedd', prim: '#5b45ff', yellow: '#ffc93c', pink: '#ff6f91', teal: '#17b39b', navy: '#25306e', coral: '#ff8a65', white: '#ffffff', grey: '#d7d3ea', accent: '#5b45ff' };
  const CM_FY = 930;
  const CM_T = { win: 0.3, ladder: 0.75, p1in: 1.0, climb: 1.95, p3in: 1.55, p2in: 2.35, lift: 3.05, slot: 3.8, toggle: 4.95, press: 5.95, cheer: 6.3, chat: 6.4, zoom: 7.95, logo: 8.3, tag: 8.7 };
  const CM_WIN = [540, 150, 940, 650];
  const CM_SLOT = [590, 250, 280, 210];
  const CM_BTN = [930, 500, 260, 82];
  const CM_TOG = [1300, 395, 120, 54];
  // Quadratic noodle limb with tapering width and round ends.
  function cmLimb(c, p0, pc, p1, w0, w1, col, n = 14) {
    const L = [], R = [];
    for (let k = 0; k <= n; k++) {
      const u = k / n, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
      const x = a * p0[0] + b * pc[0] + d * p1[0], y = a * p0[1] + b * pc[1] + d * p1[1];
      let tx = 2 * (1 - u) * (pc[0] - p0[0]) + 2 * u * (p1[0] - pc[0]), ty = 2 * (1 - u) * (pc[1] - p0[1]) + 2 * u * (p1[1] - pc[1]);
      const tl = Math.hypot(tx, ty) || 1, w = lerp(w0, w1, u) / 2;
      L.push([x - (ty / tl) * w, y + (tx / tl) * w]); R.push([x + (ty / tl) * w, y - (tx / tl) * w]);
    }
    c.fillStyle = col; c.beginPath();
    L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.closePath(); c.fill();
    c.beginPath(); c.arc(p0[0], p0[1], w0 / 2, 0, TAU); c.fill();
    c.beginPath(); c.arc(p1[0], p1[1], w1 / 2, 0, TAU); c.fill();
  }
  const cmBez = (p0, pc, p1, u) => [(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * pc[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * pc[1] + u * u * p1[1]];
  // Two-bone IK: the knee for hip h and ankle f, bending toward dir (+1 = +x).
  function cmKnee(h, f, a, b, dir) {
    const dx = f[0] - h[0], dy = f[1] - h[1], d = clamp(Math.hypot(dx, dy), 1, a + b - 0.5);
    const ca = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.atan2(dy, dx) - dir * Math.acos(ca);
    return [h[0] + a * Math.cos(ang), h[1] + a * Math.sin(ang)];
  }
  // Noodle arm: a bendy curve whose sag keeps the arm's length roughly constant.
  function cmArm(c, sh, hand, L, side, P, s) {
    const dx = hand[0] - sh[0], dy = hand[1] - sh[1], d = Math.hypot(dx, dy) || 1;
    let hd = hand;
    if (d > L) hd = [sh[0] + dx / d * L, sh[1] + dy / d * L];
    const dd = Math.min(d, L), sag = Math.sqrt(Math.max(0, L * L - dd * dd)) * 0.45 * side;
    const pc = [(sh[0] + hd[0]) / 2 - (dy / d) * sag, (sh[1] + hd[1]) / 2 + (dx / d) * sag];
    cmLimb(c, sh, pc, hd, 34 * s, 26 * s, P.skin);
    const sl = cmBez(sh, pc, hd, 0.3);
    cmLimb(c, sh, [(sh[0] + sl[0]) / 2, (sh[1] + sl[1]) / 2], sl, 46 * s, 42 * s, P.shirt, 4);
    c.fillStyle = P.skin; c.beginPath(); c.arc(hd[0], hd[1], 17 * s, 0, TAU); c.fill();
  }
  function cmLeg(c, hip, ank, P, s, back) {
    const a = 152 * s, b = 152 * s, kn = cmKnee(hip, ank, a, b, P.fac);
    const mid = [(hip[0] + ank[0]) / 2, (hip[1] + ank[1]) / 2], pc = [lerp(kn[0], 2 * kn[0] - mid[0], 0.55), lerp(kn[1], 2 * kn[1] - mid[1], 0.55)];
    cmLimb(c, hip, pc, ank, 80 * s, 40 * s, back ? P.pants2 || P.pants : P.pants, 16);
    // a chunky shoe pointing the way the figure faces
    c.fillStyle = P.shoe; c.beginPath(); c.ellipse(ank[0] + P.fac * 20 * s, ank[1] + 8 * s, 44 * s, 21 * s, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(ank[0] + P.fac * 20 * s - 40 * s, ank[1] + 20 * s, 80 * s, 6 * s);
  }
  // A faceless Alegria-style figure: huge legs, small torso, tiny head. Hip, ankles and hands are world positions.
  function cmPerson(c, P) {
    const s = P.s, fac = P.fac, lean = P.lean || 0, sy = P.sy || 1;
    c.save();
    if (sy !== 1) { c.translate(P.base[0], P.base[1]); c.scale(1 / Math.sqrt(sy), sy); c.translate(-P.base[0], -P.base[1]); }
    if (P.shadow) { c.fillStyle = 'rgba(80,60,170,0.12)'; c.beginPath(); c.ellipse(P.shadow[0], P.shadow[1], 150 * s * P.shadow[2], 20 * s * P.shadow[2], 0, 0, TAU); c.fill(); }
    const hip = P.hip, up = [Math.sin(lean) * fac, -Math.cos(lean)];
    const sh = [hip[0] + up[0] * 160 * s, hip[1] + up[1] * 160 * s];
    const hipF = [hip[0] + fac * 10 * s, hip[1]], hipB = [hip[0] - fac * 10 * s, hip[1]];
    cmArm(c, sh, P.hands[1], 290 * s, P.bend ? P.bend[1] : -fac, P, s);
    cmLeg(c, hipB, P.feet[1], P, s, true);
    cmLimb(c, [hip[0] - up[0] * 6, hip[1] - up[1] * 6], [hip[0] + up[0] * 80 * s, hip[1] + up[1] * 80 * s], sh, 112 * s, 92 * s, P.shirt);
    cmLimb(c, [hip[0] - up[0] * 8 * s, hip[1] - up[1] * 8 * s], hip, [hip[0] + up[0] * 26 * s, hip[1] + up[1] * 26 * s], 116 * s, 112 * s, P.pants, 4);
    cmLeg(c, hipF, P.feet[0], P, s, false);
    if (P.mid) P.mid(c, sh);
    // neck, head, hair
    const hd = [sh[0] + up[0] * 54 * s + fac * 6 * s, sh[1] + up[1] * 54 * s], hr = 27 * s;
    cmLimb(c, sh, [(sh[0] + hd[0]) / 2, (sh[1] + hd[1]) / 2], hd, 26 * s, 24 * s, P.skin, 4);
    if (P.hair === 'afro') { c.fillStyle = P.hairCol; [[-0.5, -0.5, 1.15], [0.45, -0.6, 1.05], [-0.9, 0.15, 0.95], [0, -0.95, 1.0], [0.6, 0.1, 0.85]].forEach(([ox, oy, rr]) => { c.beginPath(); c.arc(hd[0] + ox * hr - fac * 8 * s, hd[1] + oy * hr, rr * hr, 0, TAU); c.fill(); }); }
    c.fillStyle = P.skin; c.beginPath(); c.arc(hd[0], hd[1], hr, 0, TAU); c.fill();
    if (P.hair === 'bun') {
      c.fillStyle = P.hairCol; c.beginPath(); c.arc(hd[0] - fac * 3 * s, hd[1] - 2 * s, hr * 1.04, PI * 0.95, TAU * 1.02); c.fill();
      c.beginPath(); c.arc(hd[0] - fac * 20 * s, hd[1] - 26 * s, 15 * s, 0, TAU); c.fill();
    } else if (P.hair === 'short') {
      c.fillStyle = P.hairCol; c.beginPath(); c.arc(hd[0] - fac * 4 * s, hd[1] - 3 * s, hr * 1.06, fac > 0 ? PI * 0.82 : -PI * 0.05, fac > 0 ? TAU * 1.05 : PI * 0.18 + PI); c.closePath(); c.fill();
    } else if (P.hair === 'afro') {
      c.fillStyle = P.hairCol; c.beginPath(); c.arc(hd[0], hd[1] - 4 * s, hr * 1.02, PI * 1.05, TAU * 0.98); c.fill();
    }
    cmArm(c, sh, P.hands[0], 290 * s, P.bend ? P.bend[0] : -fac, P, s);
    if (P.front) P.front(c, sh);
    c.restore();
  }
  // Walk cycle: ankles from a hip track (x moving), stride phase from the distance walked.
  function cmWalk(x, x0, fac, s, stop) {
    const ph = Math.abs(x - x0) / (62 * s), k = 1 - stop;
    const f = j => { const a = ph + j * PI; return [x + fac * Math.sin(a) * 52 * s * k + (j ? -1 : 1) * fac * 6 * s * stop, CM_FY - 14 * s - Math.max(0, Math.cos(a)) * 34 * s * k]; };
    return { feet: [f(0), f(1)], bob: -Math.abs(Math.sin(ph)) * 12 * s * k };
  }
  function cmCard(c, x, y, w, h, sc = 1) {
    c.save(); c.translate(x + w / 2, y + h / 2); c.scale(sc, sc); c.translate(-w / 2, -h / 2);
    c.fillStyle = 'rgba(60,40,140,0.12)'; rrect(c, 8, 12, w, h, 22); c.fill();
    c.fillStyle = CM.white; rrect(c, 0, 0, w, h, 22); c.fill();
    c.save(); rrect(c, 14, 14, w - 28, h - 28, 14); c.clip();
    c.fillStyle = CM.peach; c.fillRect(0, 0, w, h);
    c.fillStyle = CM.yellow; c.beginPath(); c.arc(w * 0.72, h * 0.34, h * 0.13, 0, TAU); c.fill();
    c.fillStyle = CM.teal; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.36, h * 0.38); c.lineTo(w * 0.7, h); c.fill();
    c.fillStyle = CM.prim; c.beginPath(); c.moveTo(w * 0.36, h); c.lineTo(w * 0.66, h * 0.52); c.lineTo(w, h); c.fill();
    c.restore(); c.restore();
  }
  function cmCursor(c, tip, rot, sc = 1) {
    c.save(); c.translate(tip[0], tip[1]); c.rotate(rot); c.scale(sc, sc);
    const P = [[0, 0], [0, 156], [40, 120], [66, 178], [96, 165], [70, 108], [118, 108]];
    c.fillStyle = 'rgba(40,30,120,0.15)'; c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(x + 10, y + 12) : c.moveTo(x + 10, y + 12))); c.closePath(); c.fill();
    c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.fillStyle = CM.navy; c.fill(); c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = CM.white; c.stroke();
    c.restore();
  }
  const CM_CUR = [80, 168];   // where a hand grips the cursor, relative to its tip
  // Organic blob: a smoothed ring of wobbling radii.
  function cmBlob(c, x, y, r, seed, t, col, sc = 1) {
    if (sc <= 0) return;
    const n = 9, pts = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU, rr = r * sc * (1 + 0.16 * Math.sin(seed * 3.1 + k * 2.3) + 0.05 * Math.sin(t * 1.3 + k * 1.7 + seed)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    c.fillStyle = col; c.beginPath();
    for (let k = 0; k <= n; k++) {
      const p = pts[k % n], q = pts[(k + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      k ? c.quadraticCurveTo(p[0], p[1], m[0], m[1]) : c.moveTo(m[0], m[1]);
    }
    c.closePath(); c.fill();
  }
  function cmSquiggle(c, x, y, len, amp, waves, col, p, rot = 0, lw = 11) {
    if (p <= 0) return;
    c.save(); c.translate(x, y); c.rotate(rot);
    c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    const n = 40, m = Math.max(1, Math.round(n * p));
    for (let k = 0; k <= m; k++) { const u = k / n; const px = u * len, py = Math.sin(u * waves * TAU) * amp; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke(); c.restore();
  }
  function cmHeart(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath();
    c.moveTo(0, 12); c.bezierCurveTo(-26, -6, -14, -28, 0, -14); c.bezierCurveTo(14, -28, 26, -6, 0, 12); c.fill(); c.restore();
  }
  // Bar heights of the giant chart on the right (bouncy steps).
  const cmBars = t => [
    kf(t, [[0.55, 0], [1.15, 150, E.outB], [2.55, 150], [2.9, 230, E.outB]]),
    kf(t, [[0.65, 0], [1.3, 110, E.outB], [3.25, 110], [3.6, 300, E.outB]]),
    kf(t, [[0.75, 0], [1.45, 190, E.outB], [2.35, 190], [2.7, 330, E.outB], [3.95, 330], [4.3, 480, E.outB]]),
  ];
  const CM_BX = [[1530, 100, CM.lav], [1645, 100, CM.mint], [1760, 122, CM.prim]];
  function cmWindow(c, t) {
    const [x, y, w, h] = CM_WIN;
    // header, slot, avatars, text, toggle, button, chat
    c.fillStyle = 'rgba(70,50,170,0.10)'; rrect(c, x + 14, y + 20, w, h, 34); c.fill();
    c.fillStyle = CM.white; rrect(c, x, y, w, h, 34); c.fill();
    c.save(); rrect(c, x, y, w, h, 34); c.clip();
    c.fillStyle = CM.lav2; c.fillRect(x, y, w, 62);
    c.restore();
    [CM.pink, CM.yellow, CM.teal].forEach((col, k) => { const p = E.outB(seg(t, 0.55 + k * 0.08, 0.85 + k * 0.08), 2.5); c.fillStyle = col; c.beginPath(); c.arc(x + 38 + k * 30, y + 31, 10 * p, 0, TAU); c.fill(); });
    c.fillStyle = CM.white; rrect(c, x + 150, y + 17, 420 * E.outC(seg(t, 0.7, 1.1)), 28, 14); c.fill();
    text(c, 'app.plumwork.team', x + 172, y + 38, { font: JAK, weight: 500, size: 18, color: `rgba(92,95,138,${seg(t, 0.95, 1.2)})` });
    // photo slot (dashed until the card lands)
    const [sx, sy, sw, sh] = CM_SLOT;
    if (t < CM_T.slot + 0.05) { c.save(); c.setLineDash([16, 12]); c.lineDashOffset = -t * 30; c.strokeStyle = CM.lav; c.lineWidth = 5; rrect(c, sx, sy, sw, sh, 22); c.stroke(); c.restore(); text(c, '+', sx + sw / 2, sy + sh / 2 + 22, { font: JAK, weight: 800, size: 64, color: CM.lav, align: 'center' }); }
    else { const p = E.outB(seg(t, CM_T.slot, CM_T.slot + 0.4), 3); cmCard(c, sx, sy, sw, sh, lerp(1.1, 1, p)); }
    // team avatars
    [[CM.prim, 0], [CM.coral, 1], [CM.teal, 2]].forEach(([col, k]) => {
      const p = E.outB(seg(t, 1.2 + k * 0.12, 1.55 + k * 0.12), 2.6); if (p <= 0) return;
      const ax = sx + 50 + k * 90, ay = 560;
      c.fillStyle = col; c.beginPath(); c.arc(ax, ay, 36 * p, 0, TAU); c.fill();
      c.fillStyle = [CM.yellow, CM.lav, CM.peach][k]; c.beginPath(); c.arc(ax, ay - 6 * p, 13 * p, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(ax, ay + 22 * p, 20 * p, 12 * p, 0, PI, TAU); c.fill();
    });
    [0, 1].forEach(k => { const p = E.outC(seg(t, 1.6 + k * 0.15, 2.1 + k * 0.15)); c.fillStyle = k ? CM.lav2 : CM.lav; rrect(c, sx, 628 + k * 34, sw * (k ? 0.6 : 0.9) * p, 18, 9); c.fill(); });
    // progress bar fills as the work gets done
    const prog = kf(t, [[1.8, 0.08], [CM_T.slot + 0.2, 0.42], [CM_T.toggle + 0.1, 0.7], [CM_T.press + 0.1, 1.0]]);
    c.fillStyle = CM.lav2; rrect(c, sx, 724, sw, 22, 11); c.fill();
    c.fillStyle = CM.teal; rrect(c, sx, 724, sw * prog, 22, 11); c.fill();
    // headline and body lines
    const rx = 930;
    c.fillStyle = CM.ink; rrect(c, rx, 252, 330 * E.outC(seg(t, 0.9, 1.4)), 30, 15); c.fill();
    [[0, 480], [1, 420], [2, 300]].forEach(([k, lw]) => { c.fillStyle = CM.lav; rrect(c, rx, 306 + k * 30, lw * E.outC(seg(t, 1.05 + k * 0.1, 1.5 + k * 0.1)), 14, 7); c.fill(); });
    // toggle
    const [tx, ty, tw, th] = CM_TOG, on = spring(t - CM_T.toggle, 3.2, 0.38) * (t > CM_T.toggle ? 1 : 0);
    c.fillStyle = CM.lav; rrect(c, rx, ty + 18, 250 * E.outC(seg(t, 1.3, 1.7)), 18, 9); c.fill();
    c.fillStyle = on > 0.5 ? CM.teal : CM.grey; rrect(c, tx, ty, tw, th, th / 2); c.fill();
    c.fillStyle = CM.white; c.beginPath(); c.arc(tx + th / 2 + (tw - th) * clamp(on, -0.1, 1.15), ty + th / 2, th / 2 - 6, 0, TAU); c.fill();
    // Launch button
    const [bx, by, bw, bh] = CM_BTN, pr = t > CM_T.press ? Math.exp(-(t - CM_T.press) * 7) * Math.cos((t - CM_T.press) * 22) : 0, bp = E.outB(seg(t, 1.4, 1.8), 2.4);
    if (bp > 0) {
      c.save(); c.translate(bx + bw / 2, by + bh / 2); c.scale(bp * (1 + 0.06 * pr), bp * (1 - 0.1 * pr));
      c.fillStyle = 'rgba(60,40,180,0.25)'; rrect(c, -bw / 2, -bh / 2 + 10, bw, bh, bh / 2); c.fill();
      c.fillStyle = t > CM_T.press ? CM.pink : CM.prim; rrect(c, -bw / 2, -bh / 2, bw, bh, bh / 2); c.fill();
      text(c, t > CM_T.press ? 'Launched!' : 'Launch', 0, 12, { font: JAK, weight: 800, size: 32, color: CM.white, align: 'center' });
      c.restore();
      if (t > CM_T.press) for (let k = 0; k < 3; k++) {
        const u = seg(t, CM_T.press + k * 0.14, CM_T.press + 0.8 + k * 0.14); if (u <= 0 || u >= 1) continue;
        c.strokeStyle = `rgba(255,111,145,${(1 - u) * 0.8})`; c.lineWidth = 6; rrect(c, bx - u * 60, by - u * 60, bw + u * 120, bh + u * 120, bh / 2 + u * 60); c.stroke();
      }
    }
    // chat bubble
    const cp = E.outB(seg(t, CM_T.chat, CM_T.chat + 0.4), 2.4);
    if (cp > 0) {
      c.save(); c.translate(rx, 690); c.scale(cp, cp);
      c.fillStyle = CM.coral; c.beginPath(); c.arc(28, 18, 26, 0, TAU); c.fill();
      c.fillStyle = CM.lav2; rrect(c, 70, -16, 380, 70, 24); c.fill();
      c.beginPath(); c.moveTo(74, 30); c.lineTo(60, 52); c.lineTo(96, 40); c.fill();
      const nch = Math.floor(clamp((t - CM_T.chat - 0.2) / 0.6) * 16);
      text(c, 'Nice work, team!'.slice(0, nch), 96, 30, { font: JAK, weight: 700, size: 28, color: CM.ink });
      c.restore();
    }
  }
  function cmScene(c, t) {
    const T = CM_T, FY = CM_FY;
    // background blobs + squiggles + dots
    const bp = k => E.outB(seg(t, 0.05 + k * 0.07, 0.6 + k * 0.07), 1.8);
    cmBlob(c, 640, 300, 330, 1, t, CM.lav, bp(0));
    cmBlob(c, 1560, 820, 300, 2, t, CM.peach, bp(1));
    cmBlob(c, 1760, 170, 160, 3, t, CM.mint, bp(2));
    cmBlob(c, 160, 860, 190, 4, t, CM.mint, bp(3));
    c.fillStyle = 'rgba(91,69,255,0.07)'; c.beginPath(); c.ellipse(960, FY + 6, 960, 44, 0, 0, TAU); c.fill();
    cmSquiggle(c, 120, 170, 230, 22, 2.5, CM.yellow, E.outC(seg(t, 0.3, 1.0)), -0.2);
    cmSquiggle(c, 1580, 80, 200, 18, 2, CM.pink, E.outC(seg(t, 0.45, 1.1)), 0.15);
    cmSquiggle(c, 1260, 880, 180, 16, 2, CM.teal, E.outC(seg(t, 0.6, 1.2)), -0.1, 9);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const p = E.outB(seg(t, 0.5 + (i + j) * 0.05, 0.8 + (i + j) * 0.05), 2); c.fillStyle = CM.prim; c.beginPath(); c.arc(90 + i * 34, 420 + j * 34, 5 * p, 0, TAU); c.fill(); }
    // plant: big leaves on bendy stems, swaying
    const pl = E.outB(seg(t, 0.4, 0.95), 1.6);
    if (pl > 0) {
      c.save(); c.translate(150, FY); c.scale(pl, pl);
      [[-0.55, 250, CM.teal], [-0.15, 320, '#0f9a86'], [0.3, 280, CM.teal], [0.7, 210, '#0f9a86']].forEach(([a, L, col], k) => {
        const sw = Math.sin(t * 2.2 + k) * 0.05 + (t > T.cheer ? Math.sin((t - T.cheer) * 9) * 0.06 * Math.exp(-(t - T.cheer)) : 0), ang = a + sw;
        const tip = [Math.sin(ang) * L, -Math.cos(ang) * L - 40];
        c.strokeStyle = '#0c7f6f'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -40); c.quadraticCurveTo(tip[0] * 0.3, tip[1] * 0.6, tip[0], tip[1]); c.stroke();
        c.save(); c.translate(tip[0], tip[1]); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.ellipse(0, -40, 34, 70, 0, 0, TAU); c.fill(); c.restore();
      });
      c.fillStyle = CM.coral; c.beginPath(); c.moveTo(-70, -95); c.lineTo(70, -95); c.lineTo(52, 0); c.lineTo(-52, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(-70, -95, 140, 16);
      c.restore();
    }
    // the giant window springs up
    const wp = E.outB(seg(t, T.win, T.win + 0.55), 1.6);
    if (wp > 0) { c.save(); c.translate(1010, 800); c.scale(wp, wp); c.translate(-1010, -800); cmWindow(c, t); c.restore(); }
    // the giant bar chart
    const bars = cmBars(t);
    CM_BX.forEach(([bx, bw, col], k) => { const h = bars[k]; if (h <= 1) return; c.fillStyle = col; rrect(c, bx, FY - h, bw, h + 20, 18); c.fill(); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(bx + 14, FY - h + 18, 12, Math.max(0, h - 30)); });
    // ladder
    const lp = spring(t - T.ladder, 2.6, 0.45) * (t > T.ladder ? 1 : 0);
    if (lp > 0) {
      const oy = (1 - lp) * -700;
      c.save(); c.translate(0, oy);
      c.strokeStyle = CM.coral; c.lineWidth = 16; c.lineCap = 'round';
      c.beginPath(); c.moveTo(262, FY); c.lineTo(305, 540); c.moveTo(418, FY); c.lineTo(375, 540); c.stroke();
      c.lineWidth = 12;
      for (let k = 1; k <= 4; k++) { const yy = FY - 95 * k, u = (FY - yy) / (FY - 540); c.beginPath(); c.moveTo(lerp(262, 305, u), yy); c.lineTo(lerp(418, 375, u), yy); c.stroke(); }
      c.restore();
    }
    // ---- P1, the builder (purple skin, yellow top): walks in with the card, climbs, slots it ----
    if (t > T.p1in) {
      const s = 0.92, P = { s, fac: 1, skin: '#7b5cf0', shirt: CM.yellow, pants: CM.navy, pants2: '#1d265a', shoe: CM.white, hair: 'bun', hairCol: '#1e1a3c' };
      const x = kf(t, [[T.p1in, -200], [T.climb, 330, E.outQ]]), stop = seg(t, T.climb - 0.25, T.climb);
      const wk = cmWalk(x, -200, 1, s, stop);
      const lv = kf(t, [[T.climb, 0], [T.climb + 0.34, 1, E.outB], [T.climb + 0.7, 2, E.outB]]), lvB = kf(t - 0.14, [[T.climb, 0], [T.climb + 0.34, 1, E.outB], [T.climb + 0.7, 2, E.outB]]);
      const climbing = t > T.climb;
      const ankF = climbing ? [352, FY - 14 - 95 * lv - Math.sin(PI * (lv % 1)) * 26] : wk.feet[0];
      const ankB = climbing ? [324, FY - 14 - 95 * lvB - Math.sin(PI * (lvB % 1)) * 26] : wk.feet[1];
      const hipY = climbing ? Math.max(ankF[1], ankB[1]) - 282 * s + (ankF[1] - ankB[1]) * 0.25 : FY - 14 * s - 282 * s + wk.bob;
      P.hip = [climbing ? 336 : x, hipY];
      P.feet = [ankF, ankB];
      P.lean = climbing ? 0.3 * E.ioS(seg(t, T.lift - 0.3, T.lift + 0.3)) * (1 - 0.8 * seg(t, T.slot + 0.3, T.slot + 0.8)) : 0.08;
      if (!climbing) P.shadow = [x + 10, FY + 4, 1];
      // the card: carried at the chest, lifted, pushed into the slot
      const carry = [P.hip[0] + 150, P.hip[1] - 170], slot = [CM_SLOT[0] + CM_SLOT[2] / 2, CM_SLOT[1] + CM_SLOT[3] / 2];
      const cu = E.ioC(seg(t, T.lift, T.slot)), cc = [lerp(carry[0], slot[0], cu), lerp(carry[1], slot[1], cu)];
      const cardL = cc[0] - CM_SLOT[2] / 2, cardOn = t < T.slot;
      const hand0 = cardOn ? [cardL + 30, cc[1] + 70] : null, hand1 = cardOn ? [cardL + 8, cc[1] - 20] : null;
      const rel = E.ioC(seg(t, T.slot, T.slot + 0.5)), shY = P.hip[1] - 150 * s;
      const rest0 = [P.hip[0] + 70, P.hip[1] + 10], rest1 = [372, 600];
      let h0 = cardOn ? hand0 : [lerp(cardL + 30, rest0[0], rel), lerp(cc[1] + 70, rest0[1], rel)];
      const h1 = cardOn ? hand1 : [lerp(cardL + 8, rest1[0], rel), lerp(cc[1] - 20, rest1[1], rel)];
      if (t > T.cheer) { const u = E.outB(seg(t, T.cheer, T.cheer + 0.4), 2), wv = Math.sin((t - T.cheer) * 11) * 40; h0 = [lerp(h0[0], P.hip[0] + 90 + wv, u), lerp(h0[1], shY - 220, u)]; }
      P.hands = [h0, h1]; P.bend = [-1, -1];
      P.mid = cardOn ? () => cmCard(c, cardL, cc[1] - CM_SLOT[3] / 2, CM_SLOT[2], CM_SLOT[3]) : null;
      cmPerson(c, P);
    }
    // ---- P3, the analyst (blue skin, afro, laptop): rides the tallest bar ----
    if (t > T.p3in) {
      const s = 0.88, bt = FY - bars[2], drop = (1 - spring(t - T.p3in, 2.4, 0.42)) * -520;
      const bnc = Math.sin(t * 3.1) * 3;
      const hip = [1806, bt - 20 * s + drop + bnc];
      const swing = Math.sin(t * 4.2) * 14, swing2 = Math.sin(t * 4.2 + 1.4) * 14;
      const P = { s, fac: -1, skin: '#4a6cff', shirt: CM.pink, pants: CM.yellow, pants2: '#f0b52a', shoe: CM.navy, hair: 'afro', hairCol: '#2a1d4a', seated: true };
      P.hip = hip; P.lean = 0.12;
      P.feet = [[hip[0] - 150 * s + swing, hip[1] + 150 * s], [hip[0] - 128 * s + swing2, hip[1] + 158 * s]];
      const lap = [hip[0] - 96 * s, hip[1] - 22 * s];
      const cheer = t > T.cheer + 0.2 ? E.outB(seg(t, T.cheer + 0.2, T.cheer + 0.6), 2) : 0, shY = hip[1] - 150 * s;
      P.hands = [[lerp(lap[0] - 10, hip[0] - 60 + Math.sin(t * 10) * 30, cheer), lerp(lap[1] - 18, shY - 230, cheer)], [lap[0] + 34, lap[1] - 14 + Math.sin(t * 18) * 3]];
      P.bend = [1, 1];
      P.mid = () => {
        // laptop resting on the thighs, screen toward the face
        c.fillStyle = CM.navy; rrect(c, lap[0] - 64 * s, lap[1] - 6 * s, 150 * s, 14 * s, 6 * s); c.fill();
        c.save(); c.translate(lap[0] - 60 * s, lap[1] - 4 * s); c.rotate(0.22); c.fillStyle = '#cfd4ff'; rrect(c, -14 * s, -100 * s, 20 * s, 100 * s, 6 * s); c.fill(); c.restore();
      };
      cmPerson(c, P);
    }
    // ---- P2, the clicker (terracotta skin, teal top): carries the giant cursor, flips the toggle, hits Launch ----
    if (t > T.p2in) {
      const s = 1, P = { s, fac: -1, skin: '#d9664f', shirt: CM.teal, pants: CM.pink, pants2: '#e8648f', shoe: CM.navy, hair: 'short', hairCol: '#1a1630' };
      const x = kf(t, [[T.p2in, 2160], [4.05, 1290, E.outQ], [5.25, 1290], [5.7, 1225, E.ioC], [T.cheer + 0.1, 1225], [T.cheer + 1.3, 1405, E.ioS]]);
      const wk = cmWalk(x, 2160, -1, s, t < 4.05 ? seg(t, 3.8, 4.05) : t < 5.25 ? 1 : t < 5.7 ? 0.35 : 1);
      // hops of joy after the click
      const hop = t > T.cheer + 0.1 ? Math.max(0, Math.sin(PI * clamp((t - T.cheer - 0.1) / 0.5))) + Math.max(0, Math.sin(PI * clamp((t - T.cheer - 0.75) / 0.5))) : 0;
      const sq = t > T.cheer ? 1 + 0.08 * Math.sin((t - T.cheer) * 12.5) * Math.exp(-(t - T.cheer - 1.2) * 1.5 > 0 ? -(t - T.cheer - 1.2) * 1.5 : 0) : 1;
      const lift = hop * 90;
      P.hip = [x, FY - 14 - 282 + wk.bob - lift];
      P.feet = wk.feet.map(f => [f[0], f[1] - lift]);
      P.lean = kf(t, [[4.4, 0.04], [5.0, 0.18], [5.7, 0.28], [6.1, 0.22], [6.5, 0.0]]);
      P.shadow = [x, FY + 4, 1 - hop * 0.3];
      P.base = [x, FY]; P.sy = sq;
      // where the cursor tip goes: overhead, toggle, button, then waved
      const shp = [x - Math.sin(P.lean) * 160, P.hip[1] - Math.cos(P.lean) * 160];
      const over = [shp[0] - 70, shp[1] - 330];
      const tog = [CM_TOG[0] + CM_TOG[2] - 30, CM_TOG[1] + 30], btn = [CM_BTN[0] + 150, CM_BTN[1] + 52];
      const push1 = t > T.toggle - 0.08 ? Math.exp(-(t - T.toggle + 0.08) * 9) * 14 : 0, push2 = t > T.press - 0.08 ? Math.exp(-(t - T.press + 0.08) * 9) * 14 : 0;
      let tip = over;
      const a1 = E.ioC(seg(t, 4.35, T.toggle - 0.08)), a2 = E.ioC(seg(t, 5.3, T.press - 0.08)), a3 = E.outB(seg(t, T.cheer, T.cheer + 0.5), 1.6);
      tip = [lerp(tip[0], tog[0] + push1, a1), lerp(tip[1], tog[1] + push1, a1)];
      tip = [lerp(tip[0], btn[0] + push2, a2), lerp(tip[1], btn[1] + push2, a2)];
      tip = [lerp(tip[0], over[0] - 10 + Math.sin(t * 8) * 30, a3), lerp(tip[1], over[1] + 20, a3)];
      const rot = lerp(0, -0.12, a1) + Math.sin(t * 8) * 0.12 * a3;
      const grip = [tip[0] + CM_CUR[0], tip[1] + CM_CUR[1]];
      P.hands = [[grip[0] - 12, grip[1] + 4], [grip[0] + 14, grip[1] - 6]];
      P.bend = [1, 1];
      P.mid = () => cmCursor(c, tip, rot);
      cmPerson(c, P);
    }
    // hearts and sparkles burst from Launch
    if (t > T.press) {
      const r = rng(77);
      for (let k = 0; k < 16; k++) {
        const d0 = r() * 0.4, u = seg(t, T.press + d0, T.press + d0 + 1.6); if (u <= 0 || u >= 1) { r(); r(); r(); continue; }
        const a = -PI / 2 + (r() - 0.5) * 2.2, sp = 260 + r() * 300, kind = r(), col = [CM.pink, CM.yellow, CM.teal, CM.prim][k % 4];
        const px = CM_BTN[0] + CM_BTN[2] / 2 + Math.cos(a) * sp * E.outC(u) + Math.sin(u * 8 + k) * 14, py = CM_BTN[1] + Math.sin(a) * sp * E.outC(u) - u * 120;
        const sc = E.outB(seg(u, 0, 0.2), 2.5) * (1 - seg(u, 0.75, 1)) * (1 + r() * 0.6);
        if (kind < 0.55) cmHeart(c, px, py, sc * 1.4, col);
        else { c.fillStyle = col; c.save(); c.translate(px, py); c.rotate(u * 6); c.fillRect(-12 * sc, -4 * sc, 24 * sc, 8 * sc); c.fillRect(-4 * sc, -12 * sc, 8 * sc, 24 * sc); c.restore(); }
      }
    }
  }

  MG.film({
    id: 'corpmemphis', dur: 10, poster: 9.4,
    fonts: [['800 72px "Plus Jakarta Sans"', 'plumworkLaunched!+'], ['700 28px "Plus Jakarta Sans"', 'Nice work, team!'], ['500 32px "Plus Jakarta Sans"', 'Work grows better together.app.plumwork.team']],
    meta: {
      family: 'J', name: 'Corporate Memphis', sub: 'Big Limbs, Tiny Heads, Flat Optimism', era: '2017 —',
      origin: 'The flat vector illustration style that took over tech websites, onboarding screens and explainer ads from about 2017: faceless figures with long, bendy limbs, tiny heads and purple or blue skin, collaborating among blobs, squiggles and oversized UI. Buck’s Alegria system for Facebook (2017) set the template; the mocking nickname “Corporate Memphis” came later, nodding to the squiggles of the 1980s Memphis Group, as free kits spread it everywhere and it became shorthand for friendly, interchangeable brand optimism.',
      works: 'Alegria illustration system (Buck for Facebook, 2017) · Memphis Group (founded by Ettore Sottsass, Milan, 1981) — the namesake',
      tech: ['Two-bone IK noodle limbs', 'Walk cycles from hip tracks', 'Spring-eased UI pops'],
      accent: '#5b45ff',
      motionDNA: 'Bouncy and buoyant: every element pops on an overshoot spring, characters walk with a big hip bob and rubber-hose arms that never show an elbow, legs dangle and swing, props grow in eased steps, toggles snap and buttons squish, and the piece ends on a hop of joy and a pull-back to the logo.',
      visualDNA: 'Flat fills, no outlines, no gradients: cream page, lavender, peach and mint blobs, yellow and pink squiggles, dot grids, a potted monstera; faceless characters with oversized legs and hands, minuscule heads and non-naturalistic skin (violet, blue, terracotta); giant white app cards with rounded corners, toggles, progress bars and a primary-violet call to action.',
      transitions: 'Pop-on blobs → window springs up → characters walk / drop in → card slot snap → toggle flip → button press burst → pull-back to brand lockup',
      implementation: ['Illustrator + After Effects (Duik / RubberHose rigs)', 'Lottie / Rive exports for product UI', 'Figma illustration kits', 'Canvas 2D: bezier noodle limbs with two-bone IK, keyframed hip / hand tracks, spring easing'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      c.fillStyle = CM.bg; c.fillRect(0, 0, W, H);
      const z = E.ioC(seg(t, CM_T.zoom, CM_T.zoom + 0.75)), sc = lerp(1, 0.78, z);
      c.save(); c.translate(960, lerp(0, 62, z)); c.scale(sc, sc); c.translate(-960, 0);
      cmScene(c, t);
      c.restore();
      // the lockup for the fictional app
      if (t > CM_T.logo) {
        const p = E.outB(seg(t, CM_T.logo, CM_T.logo + 0.5), 2), q = E.outC(seg(t, CM_T.tag, CM_T.tag + 0.5));
        c.save(); c.font = `800 72px ${JAK}`; const ww = c.measureText('plumwork').width, x0 = 960 - (ww + 96) / 2, y0 = 952;
        c.translate(x0 + 34, y0 - 24); c.scale(p, p);
        c.fillStyle = CM.prim; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill();
        c.fillStyle = CM.teal; c.beginPath(); c.ellipse(16, -36, 9, 20, 0.7, 0, TAU); c.fill();
        c.fillStyle = CM.white; c.beginPath(); c.arc(-10, -8, 8, 0, TAU); c.fill();
        c.restore();
        c.save(); c.globalAlpha = clamp(p);
        text(c, 'plumwork', x0 + 96, y0, { font: JAK, weight: 800, size: 72, color: CM.ink, ls: -1 });
        c.globalAlpha = q;
        text(c, 'Work grows better together.', 960, y0 + 58 + (1 - q) * 10, { font: JAK, weight: 500, size: 32, color: CM.soft, align: 'center' });
        c.restore();
      }
      grain(c, W, H, t, 0.025, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const B = 0.5, T = CM_T;
      // ukulele-pop progression C – G – Am – F, one chord a bar of two beats
      const prog = [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [57, 60, 65, 69]], bass = [36, 43, 45, 41];
      const strum = (t, ch, g = 0.07, up = false) => (up ? [...ch].reverse() : ch).forEach((m, i) => A.pluck(t + i * 0.012, midi(m), { g, dur: 0.5, bright: 0.85, decay: 0.985, lp: 4500, rev: 0.2, pan: (i - 1.5) * 0.15 }));
      for (let k = 0; k < 18; k++) {
        const t = 0.5 + k * B, ch = prog[Math.floor(k / 2) % 4];
        if (t > T.zoom + 0.1) break;
        strum(t, ch, 0.06); strum(t + B * 0.5, ch, 0.04, true);
        if (k % 2 === 0) A.pluck(t, midi(bass[Math.floor(k / 2) % 4]), { g: 0.2, dur: 0.9, bright: 0.4, decay: 0.993 });
        if (k >= 2) { A.kick(t, 0.32, { f: 120, f2: 45 }); A.hat(t + B * 0.5, 0.035, false, { pan: 0.3 }); A.hat(t + B * 0.75, 0.02, false, { pan: -0.3 }); }
        if (k >= 4 && k % 2 === 1) A.clap(t, 0.12);
      }
      // pops for the blobs, window, avatars and button
      [0.1, 0.18, 0.25, 0.32, 0.4, T.win, 1.2, 1.32, 1.44, 1.45].forEach((t, k) => A.osc(t, { f: 380 + k * 60, f2: 900 + k * 70, glide: 0.06, dur: 0.1, g: 0.05, rev: 0.2, pan: (hash(k) - 0.5) * 0.8 }));
      // ladder lands, footsteps, climbing boings
      A.osc(T.ladder + 0.18, { type: 'triangle', f: 220, f2: 110, glide: 0.08, dur: 0.14, g: 0.12 });
      for (let k = 0; k < 6; k++) A.osc(T.p1in + 0.08 + k * 0.15, { type: 'triangle', f: 180, f2: 120, glide: 0.04, dur: 0.06, g: 0.05 });
      [T.climb, T.climb + 0.34].forEach((t, k) => A.osc(t + 0.05, { f: 300 + k * 120, f2: 620 + k * 160, glide: 0.12, dur: 0.18, g: 0.05, vib: [16, 20] }));
      // P3 drops onto the bar; bars grow in bouncy steps
      A.osc(T.p3in + 0.25, { f: 900, f2: 300, glide: 0.25, dur: 0.3, g: 0.04, vib: [10, 30] });
      [1.15, 2.65, 2.9, 3.6, 4.25].forEach((t, k) => A.osc(t - 0.1, { f: 260 + k * 50, f2: 700 + k * 80, glide: 0.18, dur: 0.24, g: 0.04, vib: [18, 25] }));
      // card slots in: a woody click + sparkle
      A.osc(T.slot, { type: 'triangle', f: 900, f2: 600, glide: 0.04, dur: 0.08, g: 0.1 }); A.noise(T.slot, { type: 'bandpass', f: 3000, q: 3, dur: 0.03, g: 0.08 });
      [88, 91].forEach((m, i) => A.bell(T.slot + 0.08 + i * 0.07, midi(m), { g: 0.03, dur: 0.6 }));
      // toggle flip
      A.noise(T.toggle, { type: 'bandpass', f: 2400, q: 4, dur: 0.025, g: 0.1 }); A.osc(T.toggle + 0.02, { f: 660, f2: 990, glide: 0.06, dur: 0.12, g: 0.05 });
      // marimba hook once things start working
      const mar = (t, m, g = 0.05) => { A.osc(t, { f: midi(m), dur: 0.35, g, a: 0.002, rev: 0.25 }); A.osc(t, { f: midi(m) * 4, dur: 0.06, g: g * 0.25 }); };
      [[4.5, 72], [4.75, 76], [5.0, 79], [5.25, 76], [5.5, 74], [5.75, 71]].forEach(([t, m]) => mar(t, m));
      // Launch: a ding, a whoosh of hearts, a whistle hook and the hops
      A.bell(T.press, midi(84), { g: 0.06, dur: 1.4 }); A.bell(T.press + 0.1, midi(88), { g: 0.05, dur: 1.4 });
      A.whoosh(T.press, 0.7, { f1: 600, f2: 5000, g: 0.07 });
      for (let k = 0; k < 8; k++) A.bell(T.press + 0.15 + k * 0.08, midi([91, 95, 98, 103, 98, 95, 100, 103][k]), { g: 0.018, dur: 0.5, pan: Math.sin(k * 2) * 0.6, ratios: [1, 2.76] });
      [[6.4, 79, 0.2], [6.6, 84, 0.2], [6.85, 83, 0.15], [7.0, 79, 0.3], [7.4, 76, 0.2], [7.6, 77, 0.35]].forEach(([t, m, d]) => A.osc(t, { f: midi(m), dur: d, g: 0.04, a: 0.02, vib: [5.5, 6], hold: true, rel: 0.05, rev: 0.35 }));
      [T.cheer + 0.1, T.cheer + 0.75].forEach(t => { A.osc(t, { f: 200, f2: 600, glide: 0.2, dur: 0.25, g: 0.06, vib: [20, 30] }); A.osc(t + 0.5, { type: 'triangle', f: 180, f2: 90, glide: 0.06, dur: 0.1, g: 0.07 }); });
      A.osc(T.chat + 0.1, { f: 1046, dur: 0.12, g: 0.04 }); A.osc(T.chat + 0.2, { f: 1318, dur: 0.2, g: 0.04 });
      // pull-back and lockup: a bright resolving strum and a logo chime
      A.whoosh(T.zoom, 0.6, { f1: 400, f2: 2500, g: 0.06 });
      strum(T.logo, [48, 55, 60, 64, 67, 72], 0.08);
      A.pluck(T.logo, midi(36), { g: 0.22, dur: 1.6, bright: 0.4, decay: 0.995 });
      A.chord(T.logo, [60, 64, 67, 71], { type: 'triangle', dur: 1.6, g: 0.025, a: 0.03, hold: true, rel: 0.6, lp: 3000, spread: 5, width: 0.7, rev: 0.4 });
      [84, 88, 91].forEach((m, i) => A.bell(T.logo + 0.1 + i * 0.1, midi(m), { g: 0.035, dur: 1.2, rev: 0.45 }));
      A.osc(T.tag, { f: 880, f2: 1320, glide: 0.1, dur: 0.18, g: 0.03 });
    },
  });
})();
