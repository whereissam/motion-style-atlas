/* batch b3 — MoGraph cloner, generative flow-field particles, FUI targeting HUD. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=block');
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));
  const MONO = '"JetBrains Mono", "Noto Sans SC", monospace';
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  /* ============ 11 MoGraph — Cinema 4D cloner + effectors ============ */
  const MO_N = 13, MO_C = 6, MO_SP = 112, MO_S = 86, MO_F = 1500, MO_R = 92;
  const MO_BEATS = [3.2, 3.6, 4.0, 4.4, 4.8];
  const MO_L = (() => { const v = [-0.42, 1, -0.32], m = Math.hypot(...v); return v.map(x => x / m); })();
  const MO_COL = { lit: [252, 249, 244], shd: [118, 124, 146], acc: [255, 78, 30], accS: [150, 26, 16] };
  const MO_FACES = [[1, 3, 7, 5, 1, 0, 0], [0, 4, 6, 2, -1, 0, 0], [2, 6, 7, 3, 0, 1, 0], [0, 1, 5, 4, 0, -1, 0], [4, 5, 7, 6, 0, 0, 1], [0, 2, 3, 1, 0, 0, -1]];
  const moHero = d => MO_S + (6 - d) * 68 + (d === 0 ? 80 : 0);
  const moLand2 = d => 7.5 + (6 - d) / 6 * 0.68;
  const MO_SPH_LAND = 8.5;

  function moCam(yaw, pitch, dist, ty, W, H) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const pos = [-dist * cp * sy, ty + dist * sp, -dist * cp * cy];
    const view = (x, y, z) => {
      const qx = x, qy = y - ty, qz = z;
      const x1 = qx * cy - qz * sy, z1 = qx * sy + qz * cy;
      return [x1, qy * cp + z1 * sp, -qy * sp + z1 * cp + dist];
    };
    const proj = (x, y, z) => {
      const v = view(x, y, z);
      return [W / 2 + MO_F * v[0] / v[2], H / 2 - MO_F * v[1] / v[2], v[2]];
    };
    return { pos, view, proj };
  }

  function moCube(i, j, t) {
    const u = i - MO_C, v = j - MO_C, d = Math.max(Math.abs(u), Math.abs(v));
    const r = Math.hypot(u, v) / (MO_C * Math.SQRT2), ang = Math.atan2(v, u);
    const hh = hash(i * 31 + j * 7 + 1);
    let px = u * MO_SP, pz = v * MO_SP, y = 0, h = MO_S, s = MO_S, rx = 0, ry = 0, rz = 0, acc = 0;
    // A — delay effector: the array rains in along the diagonal
    const tl = 0.12 + (i + j) / (2 * (MO_N - 1)) * 1.1;
    if (t < tl) {
      const p = seg(t, tl - 0.5, tl);
      y = 1700 * (1 - E.inQ(p));
      rx = (1 - p) * (hh - 0.5) * 2;
      rz = (1 - p) * (hash(i * 5 + j * 17) - 0.5) * 2;
    } else {
      const k = t - tl, sq = Math.exp(-k * 8) * Math.cos(k * 26);
      h *= 1 - 0.32 * sq; s *= 1 + 0.12 * sq;
    }
    // B — shader effector: radial sine wave
    const wA = E.ioS(seg(t, 1.25, 2.0)) * (1 - E.ioS(seg(t, 2.95, 3.35)));
    if (wA > 0) {
      const w = 0.5 + 0.5 * Math.sin((u * 0.75 + v * 0.45) * 0.95 - (t - 1.25) * 7);
      h += wA * 380 * w * w * (0.75 + 0.25 * Math.cos(r * 6));
    }
    // C — sound effector: kick-driven rings
    MO_BEATS.forEach((b, k) => {
      const dt = t - b;
      if (dt < 0 || dt > 1.6) return;
      const big = k === 4 ? 1.45 : 1;
      const g = Math.exp(-Math.pow(r - dt * 1.9, 2) / 0.012) * Math.exp(-dt * 1.5);
      h += (340 * g + 110 * Math.exp(-dt * 9) * hh * hh) * big;
      acc = Math.max(acc, g);
    });
    // D — twist: inner rings wind up into a spiral galaxy
    const tw = E.ioC(seg(t, 4.95, 5.9)) * (1 - E.ioC(seg(t, 6.45, 7.2)));
    if (tw > 0) {
      const a = tw * 2.6 * Math.pow(1 - r, 1.3);
      const ca = Math.cos(a), sa = Math.sin(a);
      const nx = px * ca - pz * sa, nz = px * sa + pz * ca;
      px = nx; pz = nz;
      ry += a * 1.4;
      const spi = 0.5 + 0.5 * Math.sin((ang + a) * 3 - r * 13 + (t - 4.95) * 6);
      h += tw * 420 * Math.pow(spi, 3) * (1 - r * 0.45);
      acc = Math.max(acc, tw * Math.pow(spi, 12) * 0.95);
    }
    // E — random effector lifts everything, then a step/cascade drops it into the hero stack
    const lift = E.outQt(seg(t, 6.55, 7.25));
    if (lift > 0) {
      const tl2 = moLand2(d);
      const fall = E.inQ(seg(t, tl2 - 0.42, tl2));
      const air = lift * (1 - fall);
      h = lerp(h, moHero(d), E.ioC(seg(t, 6.7, 7.4)));
      s = lerp(s, MO_S, lift);
      acc *= 1 - lift;
      y += air * (360 + 860 * hh + Math.max(0, t - 6.55) * 60);
      rx += air * (hash(i * 3 + j * 11) - 0.5) * 5;
      ry += air * (hash(i * 13 + j * 3) - 0.5) * 5;
      rz += air * (hash(i * 7 + j * 19) - 0.5) * 5;
      if (t >= tl2) {
        const k = t - tl2, sq = Math.exp(-k * 9) * Math.cos(k * 28);
        h *= 1 - 0.16 * sq; s *= 1 + 0.08 * sq;
        if (d === 3) acc = Math.max(acc, E.outC(seg(t, tl2, tl2 + 0.25)));
      }
    }
    return { px, y, pz, h, s, rx, ry, rz, acc, d };
  }

  function moShadeCol(n, acc, V) {
    const lam = Math.max(0, n[0] * MO_L[0] + n[1] * MO_L[1] + n[2] * MO_L[2]);
    let col = mix3(MO_COL.shd, MO_COL.lit, 0.3 + 0.7 * lam);
    if (acc > 0.002) col = mix3(col, mix3(MO_COL.accS, MO_COL.acc, 0.3 + 0.7 * lam), Math.min(1, acc));
    const fr = Math.pow(1 - Math.abs(n[0] * V[0] + n[1] * V[1] + n[2] * V[2]), 3) * 0.28;
    return mix3(col, [255, 255, 255], fr);
  }

  function moDrawCube(c, cam, o) {
    const { px, y, pz, h, s, rx, ry, rz, acc } = o;
    const cxr = Math.cos(rx), sxr = Math.sin(rx), cyr = Math.cos(ry), syr = Math.sin(ry), czr = Math.cos(rz), szr = Math.sin(rz);
    const rot = (x, yy, z) => {
      const x1 = x * czr - yy * szr, y1 = x * szr + yy * czr;
      const y2 = y1 * cxr - z * sxr, z2 = y1 * sxr + z * cxr;
      return [x1 * cyr + z2 * syr, y2, -x1 * syr + z2 * cyr];
    };
    const hs = s / 2, hh = h / 2, wx = px, wy = y + hh, wz = pz;
    const Vw = [], S = [];
    for (let b = 0; b < 8; b++) {
      const q = rot(b & 1 ? hs : -hs, b & 2 ? hh : -hh, b & 4 ? hs : -hs);
      const p = [wx + q[0], wy + q[1], wz + q[2]];
      Vw.push(p);
      const sp = cam.proj(p[0], p[1], p[2]);
      if (sp[2] < 60) return;
      S.push(sp);
    }
    const tilted = Math.abs(rx) + Math.abs(rz) > 0.05;
    for (const f of MO_FACES) {
      const n = rot(f[4], f[5], f[6]);
      const fc = [0, 0, 0];
      for (let k = 0; k < 4; k++) { const p = Vw[f[k]]; fc[0] += p[0] / 4; fc[1] += p[1] / 4; fc[2] += p[2] / 4; }
      const vx = cam.pos[0] - fc[0], vy = cam.pos[1] - fc[1], vz = cam.pos[2] - fc[2];
      if (n[0] * vx + n[1] * vy + n[2] * vz <= 0) continue;
      const vl = Math.hypot(vx, vy, vz);
      const col = moShadeCol(n, acc, [vx / vl, vy / vl, vz / vl]);
      c.beginPath();
      for (let k = 0; k < 4; k++) { const p = S[f[k]]; k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      c.closePath();
      if (!tilted && Math.abs(n[1]) < 0.3) {
        // ambient occlusion toward the floor on side faces
        let lo = S[f[0]], hi = S[f[0]], loY = 1e9, hiY = -1e9;
        for (let k = 0; k < 4; k++) { const wy2 = Vw[f[k]][1]; if (wy2 < loY) { loY = wy2; lo = S[f[k]]; } if (wy2 > hiY) { hiY = wy2; hi = S[f[k]]; } }
        const g = c.createLinearGradient(lo[0], lo[1], hi[0], hi[1]);
        const ao = y < 4 ? 0.72 : 0.9;
        g.addColorStop(0, rgb(col.map(x => x * ao)));
        g.addColorStop(Math.min(1, 140 / Math.max(h, 1)), rgb(col));
        g.addColorStop(1, rgb(col));
        c.fillStyle = g; c.strokeStyle = rgb(col);
      } else {
        c.fillStyle = c.strokeStyle = rgb(col);
      }
      c.lineWidth = 1; c.fill(); c.stroke();
      if (n[1] > 0.9) { c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.4; c.stroke(); }
    }
  }

  MG.film({
    id: 'mograph', dur: 10, poster: 9.4,
    fonts: [['900 72px Archivo', 'MoGraph'], ['800 20px Archivo', 'Aa1'], ['400 16px "JetBrains Mono"', 'Aa1·×—'], ['700 22px "Noto Sans SC"', '三维克隆']],
    meta: {
      cn: '三维克隆', en: 'MoGraph', era: '2006 —',
      origin: 'Cinema 4D 于 2006 年推出 MoGraph 模块，克隆器 + 效果器的程序化阵列成为一代动态设计的通用语言',
      works: '代表作：ManvsMachine 为 Nike Air Max 制作的系列广告；Beeple《Everydays》（2007 年起每日一图）',
      tech: ['克隆器 Cloner 网格阵列', '效果器叠加：波形 / 声音 / 扭曲 / 随机 / 级联', '透视投影 + 画家算法深度排序 + 平面着色'],
      accent: '#ff4e1e',
    },
    setup() { const sh = offscreen(480, 270); return { sh, sg: sh.getContext('2d') }; },
    draw(c, t, W, H, st) {
      // studio cyclorama
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#efebe5'); bg.addColorStop(1, '#d3cec6');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const hl = c.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, 1100);
      hl.addColorStop(0, 'rgba(255,255,255,0.6)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hl; c.fillRect(0, 0, W, H);

      // camera
      let kick = 0;
      MO_BEATS.forEach((b, k) => { if (t >= b) kick += Math.exp(-(t - b) * 8) * (k === 4 ? 1.6 : 1); });
      const yaw = kf(t, [[0, -0.95], [3, -0.4, E.ioS], [6.6, 0.22, E.ioS], [8.7, 0.6, E.outC], [10, 0.68, E.lin]]);
      const pitch = kf(t, [[0, 1.33], [1.9, 0.88, E.ioC], [4.8, 0.8, E.ioS], [6.6, 0.66, E.ioS], [7.4, 0.52, E.ioC], [8.7, 0.7, E.outC], [10, 0.7]]);
      const dist = kf(t, [[0, 3100], [1.9, 2550, E.outC], [4.8, 2280, E.ioS], [6.6, 2080, E.ioS], [7.4, 2750, E.outC], [8.7, 2120, E.ioC], [10, 2040, E.lin]]) - kick * 70;
      const ty = kf(t, [[0, 0], [6.55, 120], [7.3, 430, E.outC], [8.5, 210, E.ioC], [10, 200]]);
      const cam = moCam(yaw, pitch, dist, ty, W, H);

      const items = [];
      for (let i = 0; i < MO_N; i++) for (let j = 0; j < MO_N; j++) items.push(moCube(i, j, t));

      // soft floor shadows: quarter-res mask, blurred twice
      const sg = st.sg;
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, 480, 270);
      sg.setTransform(0.25, 0, 0, 0.25, 0, 0);
      sg.fillStyle = 'rgb(46,44,70)';
      items.forEach(o => {
        const a = clamp(1 - o.y / 1500);
        if (a <= 0) return;
        sg.globalAlpha = a;
        const cr = Math.cos(o.ry), sr = Math.sin(o.ry), hs = o.s / 2;
        for (const k of [0, 0.5, 1]) {
          const hg = o.y + o.h * k, ox = 0.42 * hg, oz = 0.32 * hg;
          sg.beginPath();
          [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]].forEach(([a1, b1], q) => {
            const p = cam.proj(o.px + a1 * cr + b1 * sr + ox, 0, o.pz - a1 * sr + b1 * cr + oz);
            q ? sg.lineTo(p[0], p[1]) : sg.moveTo(p[0], p[1]);
          });
          sg.fill();
        }
      });
      sg.globalAlpha = 1;
      c.save();
      c.filter = 'blur(18px)'; c.globalAlpha = 0.42; c.drawImage(st.sh, 0, 0, W, H);
      c.filter = 'blur(3px)'; c.globalAlpha = 0.3; c.drawImage(st.sh, 0, 0, W, H);
      c.restore();

      // painter's algorithm: far to near from the camera
      const cp = cam.pos;
      items.forEach(o => { const dy = o.y + Math.min(o.h, o.s) / 2 - cp[1]; o.key = (o.px - cp[0]) ** 2 + (o.pz - cp[2]) ** 2 + (o.y > 1 ? dy * dy : 0); });
      items.sort((a, b) => b.key - a.key);
      items.forEach(o => moDrawCube(c, cam, o));

      // hero sphere drops onto the centre pillar
      if (t > 8.15) {
        const top = moHero(0);
        const k = t - MO_SPH_LAND;
        let sy = top + MO_R;
        if (k < 0) sy += 1500 * (1 - E.inQ(seg(t, 8.15, MO_SPH_LAND)));
        else sy += 120 * Math.exp(-k * 5) * Math.abs(Math.sin(k * 11));
        const sqz = k >= 0 ? 1 - 0.14 * Math.exp(-k * 14) * Math.abs(Math.cos(k * 11)) : 1;
        // contact shadow on the pillar top
        const cs = cam.proj(0, top, 0), near = Math.exp(-(sy - top - MO_R) / 160);
        if (cs[2] > 60) {
          const rr = MO_R * 0.75 * MO_F / cs[2];
          const g = c.createRadialGradient(cs[0], cs[1], 0, cs[0], cs[1], rr);
          g.addColorStop(0, `rgba(40,30,40,${0.5 * near})`); g.addColorStop(1, 'rgba(40,30,40,0)');
          c.save(); c.translate(cs[0], cs[1]); c.scale(1, Math.sin(pitch)); c.translate(-cs[0], -cs[1]);
          c.fillStyle = g; c.beginPath(); c.arc(cs[0], cs[1], rr, 0, TAU); c.fill(); c.restore();
        }
        const sp = cam.proj(0, sy - MO_R * (1 - sqz), 0);
        if (sp[2] > 60) {
          const pr = MO_R * MO_F / sp[2];
          const lv = cam.view(MO_L[0] * 1000, ty + MO_L[1] * 1000, MO_L[2] * 1000), lo = cam.view(0, ty, 0);
          let lx = lv[0] - lo[0], ly = -(lv[1] - lo[1]); const lm = Math.hypot(lx, ly) || 1; lx /= lm; ly /= lm;
          c.save();
          c.translate(sp[0], sp[1]); c.scale(1 / Math.sqrt(sqz), sqz);
          const g = c.createRadialGradient(lx * pr * 0.42, ly * pr * 0.42, pr * 0.04, 0, 0, pr);
          g.addColorStop(0, '#ffd9c2'); g.addColorStop(0.22, '#ff8a55'); g.addColorStop(0.68, '#f0420f'); g.addColorStop(1, '#8c1806');
          c.fillStyle = g; c.beginPath(); c.arc(0, 0, pr, 0, TAU); c.fill();
          const rim = c.createRadialGradient(-lx * pr * 0.55, -ly * pr * 0.55, 0, -lx * pr * 0.55, -ly * pr * 0.55, pr * 0.7);
          rim.addColorStop(0, 'rgba(255,170,130,0.35)'); rim.addColorStop(1, 'rgba(255,170,130,0)');
          c.fillStyle = rim; c.beginPath(); c.arc(0, 0, pr, 0, TAU); c.fill();
          c.restore();
        }
      }

      // cloner / effector readout — an homage to the object manager
      const ui = seg(t, 0.3, 0.8) * (1 - seg(t, 8.5, 8.9));
      if (ui > 0) {
        const EFF = [[0, 'Delay  ·  Drop'], [1.25, 'Shader  ·  Sine Wave'], [3.1, 'Sound  ·  Kick'], [4.95, 'Twist  ·  Spiral'], [6.55, 'Random  ·  Lift'], [7.45, 'Step  ·  Cascade']];
        let cur = 0; EFF.forEach((e, k) => { if (t >= e[0]) cur = k; });
        const sw = E.outC(seg(t, EFF[cur][0], EFF[cur][0] + 0.3));
        text(c, 'CLONER  /  GRID ARRAY  13 × 13', 96, 92, { font: MONO, size: 15, ls: 2, color: `rgba(40,40,52,${0.55 * ui})` });
        c.fillStyle = `rgba(255,78,30,${ui})`;
        c.fillRect(96, 112 + (1 - sw) * 6, 10, 10);
        text(c, 'EFFECTOR  ' + EFF[cur][1], 118, 122 + (1 - sw) * 6, { font: MONO, size: 15, ls: 2, color: `rgba(40,40,52,${0.75 * ui * sw})` });
        const f = Math.floor(t * 30);
        text(c, 'F ' + String(f).padStart(4, '0') + ' / 0300', W - 96, 92, { font: MONO, size: 15, ls: 2, align: 'right', color: `rgba(40,40,52,${0.45 * ui})` });
      }
      // end title
      const ta = E.outC(seg(t, 8.65, 9.2));
      if (ta > 0) {
        c.fillStyle = `rgba(255,78,30,${ta})`;
        c.fillRect(96, 936 - 50 * E.outQt(seg(t, 8.65, 9.0)), 8, 50 * E.outQt(seg(t, 8.65, 9.0)));
        text(c, 'MoGraph', 124 - (1 - ta) * 20, 936, { font: 'Archivo, sans-serif', weight: 900, size: 64, ls: -1, color: `rgba(28,28,34,${ta})` });
        const sa = E.outC(seg(t, 8.9, 9.4));
        text(c, '三维克隆', 126, 980, { font: '"Noto Sans SC", sans-serif', weight: 700, size: 22, color: `rgba(28,28,34,${sa * 0.8})` });
        text(c, 'CLONER  ·  EFFECTORS  ·  2006 —', 230, 979, { font: MONO, size: 15, ls: 3, color: `rgba(28,28,34,${sa * 0.55})` });
      }
      grain(c, W, H, t, 0.045);
      vignette(c, W, H, 0.22, '60,50,40');
    },
    score(A) {
      A.osc(0, { f: 41.2, dur: 9.9, g: 0.07, a: 1.5, hold: true, rel: 0.8 });
      // A — every other diagonal lands: wooden marble ticks
      for (let k = 0; k <= 24; k += 2) {
        const tl = 0.12 + k / 24 * 1.1;
        A.osc(tl, { f: 620 + k * 18, f2: 210, glide: 0.05, dur: 0.07, g: 0.1, pan: (k / 24 - 0.5) * 0.9 });
        A.noise(tl, { type: 'bandpass', f: 3400, q: 2, dur: 0.02, g: 0.05 });
      }
      A.kick(1.22, 0.55);
      // B — wave: filtered pad + plucked arpeggio
      A.chord(1.25, [50, 57, 62, 64, 69], { type: 'sawtooth', dur: 2.2, g: 0.022, a: 0.6, hold: true, rel: 0.5, lp: 500, lp2: 2600, lpT: 1.5, spread: 8, width: 1.2, rev: 0.4 });
      [62, 69, 74, 76, 81, 76, 74, 69, 62, 69].forEach((m, k) => A.pluck(1.3 + k * 0.18, midi(m), { g: 0.16, dur: 1.2, pan: k % 2 ? 0.35 : -0.35, rev: 0.25 }));
      // C — sound effector section
      MO_BEATS.forEach((b, k) => {
        A.kick(b, k === 4 ? 0.95 : 0.8);
        A.osc(b, { type: 'sawtooth', f: midi(38), dur: 0.38, g: 0.08, lp: 1100, lp2: 140, lpT: 0.3 });
        A.hat(b + 0.2, 0.07, k % 2 === 1, { pan: 0.3 });
        if (k % 2) A.clap(b, 0.22);
      });
      for (let k = 0; k < 16; k++) A.hat(3.2 + k * 0.1, 0.025 + (k % 2 ? 0 : 0.015), false, { pan: -0.3 });
      A.chord(4.8, [50, 57, 62, 66, 69], { type: 'triangle', dur: 0.5, g: 0.035, rev: 0.5 });
      // D — twist riser
      A.riser(5.0, 1.55, { g: 0.15, f: 82.4 });
      A.whoosh(5.3, 1.2, { f1: 200, f2: 2400, g: 0.1, pan: -0.5 });
      A.whoosh(5.9, 0.8, { f1: 400, f2: 3800, g: 0.08, pan: 0.5 });
      // E — lift: suck, release, floating shimmer
      A.noise(6.15, { type: 'bandpass', f: 300, f2: 5200, dur: 0.42, g: 0.13, swell: 0.95 });
      A.impact(6.57, 0.55);
      A.chord(6.57, [62, 69, 74, 78, 81], { type: 'triangle', dur: 1.1, g: 0.028, rev: 0.7, width: 1.4 });
      for (let k = 0; k < 9; k++) A.bell(6.7 + k * 0.08, midi(86 + [0, 3, 5, 7, 10, 12, 10, 7, 5][k]), { g: 0.035, dur: 0.9, pan: hash(k + 2) * 1.4 - 0.7, rev: 0.6 });
      // cascade landings, outer ring first
      for (let d = 6; d >= 0; d--) {
        const tl = moLand2(d);
        A.pluck(tl, midi(62 + [0, 2, 4, 7, 9, 11, 14][6 - d]), { g: 0.2, dur: 0.8, bright: 0.9, rev: 0.2, pan: (d % 2 ? 0.3 : -0.3) });
        A.osc(tl, { f: 160, f2: 50, glide: 0.08, dur: 0.18, g: 0.18 + (6 - d) * 0.03 });
        A.noise(tl, { type: 'bandpass', f: 2600, q: 1.5, dur: 0.03, g: 0.05 });
      }
      // hero sphere lands
      A.kick(MO_SPH_LAND, 0.9);
      A.bell(MO_SPH_LAND, midi(86), { g: 0.1, dur: 2.2 });
      A.chord(MO_SPH_LAND, [38, 50, 57, 62, 66, 69, 74], { type: 'sine', dur: 1.45, g: 0.04, a: 0.02, rev: 0.6, width: 1.2 });
      [Math.PI / 11, 2 * Math.PI / 11].forEach((k, i) => A.osc(MO_SPH_LAND + k, { f: 140, f2: 55, glide: 0.06, dur: 0.15, g: 0.16 / (i + 1) }));
      A.osc(8.9, { f: midi(93), dur: 0.9, g: 0.025, rev: 0.6 });
    },
  });

  /* ============ 12 Generative particles — curl-noise flow field ============ */
  const PN = 6000, PFPS = 50, PSTEPS = 500, PBURST = 0.42, PEXP = 7.4;
  const P_PAL = [[86, 124, 255], [64, 214, 255], [150, 112, 255], [255, 86, 168], [255, 204, 126], [236, 244, 255]];
  const P_W = [0.24, 0.26, 0.16, 0.14, 0.12, 0.08];
  function h2(x, y, s) {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function vn2(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = h2(ix, iy, s), b = h2(ix + 1, iy, s), c = h2(ix, iy + 1, s), d = h2(ix + 1, iy + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  const psi = (x, y, tt) => vn2(x * 0.0017 + 3.7 + tt * 0.11, y * 0.0017 + 1.3 - tt * 0.08, 1) + 0.3 * vn2(x * 0.0043 - tt * 0.1, y * 0.0043 + tt * 0.07, 2);
  const P_FS = 64000;
  function curl(x, y, tt, out) {
    const e = 3;
    out[0] = (psi(x, y + e, tt) - psi(x, y - e, tt)) / (2 * e) * P_FS;
    out[1] = -(psi(x + e, y, tt) - psi(x - e, y, tt)) / (2 * e) * P_FS;
  }

  function pSimulate() {
    const W = 1920, H = 1080, cx = 960, cy = 540;
    // targets: the word, rasterised and sampled
    const oc = offscreen(W, H), g = oc.getContext('2d');
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '400 640px Anton, sans-serif';
    g.fillText('FLOW', cx, 560);
    const img = g.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (img[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    const r = rng(2024), np = pts.length / 2 || 1;
    const TX = new Float32Array(PN), TY = new Float32Array(PN), O = new Float32Array(PN), BK = new Uint8Array(PN);
    const VX = new Float32Array(PN), VY = new Float32Array(PN), X = new Float32Array(PN), Y = new Float32Array(PN);
    const SPD = new Float32Array(PN), ANG = new Float32Array(PN), EXS = new Float32Array(PN);
    for (let i = 0; i < PN; i++) {
      const k = Math.floor(r() * np) * 2;
      TX[i] = (pts[k] ?? cx) + (r() - 0.5) * 3; TY[i] = (pts[k + 1] ?? cy) + (r() - 0.5) * 3;
      O[i] = (r() + r() + r() - 1.5) / 1.5;
      let u = r(), b = 0; while (b < P_W.length - 1 && u > P_W[b]) { u -= P_W[b]; b++; }
      BK[i] = b;
      ANG[i] = r() * TAU; SPD[i] = 8 + 1750 * Math.pow(r(), 1.15); EXS[i] = 420 + 1400 * Math.pow(r(), 1.6);
      X[i] = cx + Math.cos(ANG[i]) * r() * 14; Y[i] = cy + Math.sin(ANG[i]) * r() * 14;
    }
    const hist = new Float32Array(PN * (PSTEPS + 1) * 2);
    const dt = 1 / PFPS, cv = [0, 0];
    let burst = false, exploded = false;
    for (let s = 0; s <= PSTEPS; s++) {
      const ts = s * dt;
      if (!burst && ts >= PBURST) {
        burst = true;
        for (let i = 0; i < PN; i++) { VX[i] = Math.cos(ANG[i]) * SPD[i]; VY[i] = Math.sin(ANG[i]) * SPD[i]; }
      }
      if (!exploded && ts >= PEXP) {
        exploded = true;
        for (let i = 0; i < PN; i++) {
          let dx = X[i] - cx, dy = Y[i] - 560; const m = Math.hypot(dx, dy) || 1;
          const a = Math.atan2(dy, dx) + (hash(i * 1.7) - 0.5) * 0.9;
          VX[i] = Math.cos(a) * EXS[i] * (0.6 + m / 900); VY[i] = Math.sin(a) * EXS[i] * (0.6 + m / 900);
        }
      }
      const base = s * PN * 2;
      if (burst && s > 0) {
        const wc = ts < PEXP ? E.ioC(seg(ts, 5.0, 6.5)) : 0;
        const wl = E.ioC(seg(ts, 7.7, 8.6));
        const kFlow = lerp(1.1, 2.6, seg(ts, PBURST, 2.4));
        for (let i = 0; i < PN; i++) {
          let x = X[i], y = Y[i];
          curl(x, y, ts, cv);
          let vtx, vty, k;
          if (ts < PEXP) {
            vtx = cv[0]; vty = cv[1];
            k = kFlow;
            if (wc > 0) {
              const sx = (TX[i] - x) * 3.4 + cv[0] * 0.22, sy = (TY[i] - y) * 3.4 + cv[1] * 0.22;
              vtx = lerp(vtx, sx, wc); vty = lerp(vty, sy, wc); k = lerp(k, 8, wc);
            }
          } else {
            vtx = cv[0] * 1.5; vty = cv[1] * 1.5; k = 1.3;
            if (wl > 0) {
              const lane = 540 + 150 * Math.sin(x * 0.0031 + ts * 0.55) + O[i] * (52 + 30 * Math.sin(x * 0.0022 - ts * 0.8));
              const lx = 300 + 70 * O[i] * O[i] + cv[0] * 0.15, ly = (lane - y) * 4.5 + cv[1] * 0.1;
              vtx = lerp(vtx, lx, wl); vty = lerp(vty, ly, wl); k = lerp(k, 3, wl);
            }
          }
          const a = Math.min(1, k * dt);
          VX[i] += (vtx - VX[i]) * a; VY[i] += (vty - VY[i]) * a;
          x += VX[i] * dt; y += VY[i] * dt;
          if (ts > 7.8) { if (x > W + 60) x -= W + 120; else if (x < -60) x += W + 120; }
          else if (ts > 1.4 && ts < PEXP) {
            if (x > W + 30) x -= W + 60; else if (x < -30) x += W + 60;
            if (y > H + 30) y -= H + 60; else if (y < -30) y += H + 60;
          }
          X[i] = x; Y[i] = y;
        }
      }
      for (let i = 0; i < PN; i++) { hist[base + i * 2] = X[i]; hist[base + i * 2 + 1] = Y[i]; }
    }
    const buckets = P_PAL.map(() => []);
    for (let i = 0; i < PN; i++) buckets[BK[i]].push(i);
    return { hist, buckets: buckets.map(b => Int32Array.from(b)) };
  }

  MG.film({
    id: 'particles', dur: 10, poster: 9.5,
    fonts: [['400 640px Anton', 'FLOW'], ['300 52px Jost', 'GENERATIVE'], ['400 15px "JetBrains Mono"', 'Aa1·=∇ψ→'], ['700 18px "Noto Sans SC"', '粒子生成']],
    meta: {
      cn: '粒子生成', en: 'Generative Particles', era: '2001 —',
      origin: '源自 Processing（2001，Casey Reas 与 Ben Fry）与 openFrameworks（Zach Lieberman 等联合创立）的创意编程传统',
      works: '代表作：Refik Anadol《Machine Hallucinations》系列、《Unsupervised》（纽约 MoMA，2022）；Zach Lieberman 的每日代码草图',
      tech: ['旋度噪声流场 curl(∇ψ) 平流', '数千粒子加法混合长拖尾', '目标点吸引成字 → 爆散 → 层流'],
      accent: '#40d6ff',
    },
    setup() {
      const P = offscreen(1920, 1080), S = offscreen(480, 270);
      return { P, pg: P.getContext('2d'), S, sg: S.getContext('2d'), sim: null };
    },
    draw(c, t, W, H, st) {
      if (!st.sim) st.sim = pSimulate();
      const { hist, buckets } = st.sim, pg = st.pg;
      c.fillStyle = '#03040b'; c.fillRect(0, 0, W, H);
      const bgG = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1100);
      bgG.addColorStop(0, 'rgba(30,40,110,0.32)'); bgG.addColorStop(1, 'rgba(30,40,110,0)');
      c.fillStyle = bgG; c.fillRect(0, 0, W, H);

      const s = clamp(Math.floor(t * PFPS), 0, PSTEPS), sb = Math.ceil(PBURST * PFPS);
      pg.setTransform(1, 0, 0, 1, 0, 0);
      pg.globalCompositeOperation = 'source-over';
      pg.clearRect(0, 0, W, H);
      pg.globalCompositeOperation = 'lighter';
      if (s > sb) {
        const L = Math.round(kf(t, [[PBURST, 2], [0.9, 22, E.outC], [2.5, 30], [5.0, 30], [6.3, 10], [PEXP, 9], [PEXP + 0.12, 22, E.outC], [8.4, 22], [9.3, 30]]));
        const s0 = Math.max(sb, s - L), sm = Math.max(s0, s - Math.max(1, L >> 1));
        const aN = kf(t, [[PBURST, 0.95], [1.4, 0.55], [5.0, 0.5], [5.9, 0.3], [6.5, 0.6], [PEXP, 0.65], [PEXP + 0.1, 0.7], [8.4, 0.24], [10, 0.15]]);
        pg.lineWidth = 1.3;
        buckets.forEach((idx, b) => {
          [[s0, sm, aN * 0.32], [sm, s, aN]].forEach(([a0, a1, al]) => {
            if (a1 <= a0) return;
            pg.strokeStyle = rgb(P_PAL[b], al);
            pg.beginPath();
            for (let n = 0; n < idx.length; n++) {
              const i2 = idx[n] * 2;
              let o = a0 * PN * 2 + i2, px = hist[o], py = hist[o + 1];
              pg.moveTo(px, py);
              for (let k = a0 + 1; k <= a1; k++) {
                o = k * PN * 2 + i2;
                const x = hist[o], y = hist[o + 1];
                if (Math.abs(x - px) > 300 || Math.abs(y - py) > 300) pg.moveTo(x, y); else pg.lineTo(x, y);
                px = x; py = y;
              }
            }
            pg.stroke();
          });
          // heads
          const hs = 1 + 0.5 * bump(t, 6.0, 0.4, 1.0, 0.1);
          pg.fillStyle = rgb(mix3(P_PAL[b], [255, 255, 255], 0.5), Math.min(1, aN * 1.3));
          pg.beginPath();
          for (let n = 0; n < idx.length; n++) { const o = s * PN * 2 + idx[n] * 2; pg.rect(hist[o] - hs, hist[o + 1] - hs, hs * 2, hs * 2); }
          pg.fill();
        });
        // light sweep across the formed word
        const swp = seg(t, 6.45, 7.25);
        if (swp > 0 && swp < 1) {
          const sx = lerp(200, 1720, E.ioS(swp));
          const g = pg.createLinearGradient(sx - 160, 0, sx + 160, 0);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          pg.globalCompositeOperation = 'source-atop';
          pg.fillStyle = g; pg.fillRect(sx - 160, 0, 320, H);
        }
      }
      // bloom
      st.sg.globalCompositeOperation = 'source-over';
      st.sg.clearRect(0, 0, 480, 270);
      st.sg.drawImage(st.P, 0, 0, 480, 270);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(7px)'; c.globalAlpha = 0.95; c.drawImage(st.S, 0, 0, W, H);
      c.filter = 'none'; c.globalAlpha = 1; c.drawImage(st.P, 0, 0);
      // seed, burst flash and the release shockwave
      const seed = t < PBURST + 0.6 ? 1 : 0;
      if (seed) {
        const pre = E.inQ(seg(t, 0, PBURST)), post = Math.exp(-Math.max(0, t - PBURST) * 7);
        const rr = (t < PBURST ? 6 + pre * 30 + Math.sin(t * 40) * 2 : 36) * (t < PBURST ? 1 : 1 + (1 - post) * 6);
        const al = t < PBURST ? 0.4 + pre * 0.6 : post;
        const g = c.createRadialGradient(960, 540, 0, 960, 540, rr * 6);
        g.addColorStop(0, `rgba(255,255,255,${al})`); g.addColorStop(0.15, `rgba(120,200,255,${al * 0.6})`); g.addColorStop(1, 'rgba(60,100,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      if (t >= PEXP && t < PEXP + 1.2) {
        const k = t - PEXP, a = Math.exp(-k * 3.5);
        c.strokeStyle = `rgba(180,220,255,${0.5 * a})`; c.lineWidth = 2 + 6 * a;
        c.beginPath(); c.arc(960, 560, 80 + E.outC(seg(k, 0, 1.2)) * 1300, 0, TAU); c.stroke();
        const g = c.createRadialGradient(960, 560, 0, 960, 560, 900);
        g.addColorStop(0, `rgba(255,255,255,${0.55 * Math.exp(-k * 8)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      c.restore();

      // data overlay
      const ov = seg(t, 0.6, 1.2) * (1 - seg(t, 8.4, 8.8)) * 0.42;
      if (ov > 0) {
        const col = `rgba(170,190,255,${ov})`;
        text(c, 'FIELD  v = curl(∇ψ)   ·   N = 6000   ·   dt = 1/50', 80, 80, { font: MONO, size: 15, ls: 1, color: col });
        text(c, `t = ${t.toFixed(2)} s    step ${String(s).padStart(3, '0')} / ${PSTEPS}`, W - 80, 80, { font: MONO, size: 15, ls: 1, align: 'right', color: col });
        const PH = [['BIRTH', 0], ['ADVECT', 1.0], ['CONVERGE', 5.0], ['RELEASE', PEXP], ['STREAM', 8.0]];
        let x = 80;
        PH.forEach(([nm, a], k) => {
          const on = t >= a && (k === PH.length - 1 || t < PH[k + 1][1]);
          text(c, nm, x, H - 70, { font: MONO, size: 14, ls: 3, color: on ? `rgba(230,240,255,${ov * 2.2})` : col });
          x += nm.length * 11 + 70;
          if (k < PH.length - 1) text(c, '→', x - 46, H - 70, { font: MONO, size: 14, color: col });
        });
      }
      const ta = E.outC(seg(t, 8.6, 9.2));
      if (ta > 0) {
        text(c, 'GENERATIVE', W / 2 + 15, 930 + (1 - ta) * 12, { font: 'Jost, sans-serif', weight: 300, size: 52, ls: 30, align: 'center', color: `rgba(236,242,255,${ta})` });
        const sa = E.outC(seg(t, 8.9, 9.45));
        text(c, '粒子生成   ·   FLOW FIELD   ·   6,000 AGENTS', W / 2, 976, { font: MONO, size: 16, ls: 4, align: 'center', color: `rgba(190,205,255,${sa * 0.6})` });
      }
      grain(c, W, H, t, 0.04, 'screen');
      vignette(c, W, H, 0.6);
    },
    score(A) {
      // inhale to the seed, then the big bang
      A.noise(0, { type: 'bandpass', f: 200, f2: 4200, dur: PBURST, g: 0.11, q: 3, swell: 0.97 });
      A.osc(0, { f: 36, f2: 72, glide: PBURST, dur: PBURST + 0.02, g: 0.16, a: 0.38 });
      A.impact(PBURST, 0.65);
      A.noise(PBURST, { type: 'highpass', f: 5000, dur: 1.4, g: 0.07, rev: 0.6 });
      A.chord(PBURST, [38, 45, 50, 57, 64, 69, 76], { type: 'sine', dur: 4.7, g: 0.03, a: 0.8, hold: true, rel: 1.4, width: 1.4, vib: [0.3, 1.5], rev: 0.5 });
      A.osc(PBURST, { f: 36.7, dur: 9.4, g: 0.08, a: 1.5, hold: true, rel: 1.0 });
      // wind through the field
      A.noise(0.7, { type: 'bandpass', f: 380, f2: 1900, sweep: 4.2, q: 1.6, dur: 4.4, g: 0.05, swell: 0.5, rev: 0.4, pan: -0.3 });
      A.noise(1.4, { type: 'bandpass', f: 2600, f2: 700, sweep: 3.6, q: 2, dur: 3.8, g: 0.035, swell: 0.6, rev: 0.4, pan: 0.4 });
      // granular sparkle
      const sc = [0, 2, 4, 7, 9, 12, 14];
      for (let k = 0; k < 56; k++) A.osc(0.55 + hash(k * 1.13) * 4.4, { f: midi(76 + sc[k % 7]), dur: 0.28, g: 0.016, pan: hash(k + 3) * 2 - 1, rev: 0.7 });
      [62, 69, 66, 74, 69, 76, 71].forEach((m, k) => A.pluck(0.95 + k * 0.6, midi(m), { g: 0.12, dur: 1.8, bright: 0.5, rev: 0.45, pan: k % 2 ? 0.4 : -0.4 }));
      // converge
      A.riser(5.0, 1.5, { g: 0.13, f: 73.4 });
      A.noise(5.3, { type: 'lowpass', f: 400, f2: 5000, dur: 1.2, g: 0.08, swell: 0.95 });
      A.osc(6.5, { f: 55, f2: 41, glide: 1.2, dur: 1.3, g: 0.26 });
      A.chord(6.5, [38, 50, 57, 62, 66, 69, 74, 78], { type: 'triangle', dur: 1.0, g: 0.026, a: 0.01, rev: 0.7, width: 1.4 });
      A.bell(6.5, midi(86), { g: 0.09, dur: 2 });
      for (let k = 0; k < 8; k++) A.bell(6.55 + k * 0.09, midi(81 + [0, 2, 5, 7, 9, 12, 14, 17][k]), { g: 0.03, dur: 0.8, pan: (k / 7 - 0.5) * 1.6, rev: 0.6 });
      // release
      A.noise(7.0, { type: 'lowpass', f: 300, f2: 6000, dur: 0.4, g: 0.12, swell: 0.98 });
      A.impact(PEXP, 0.75);
      A.noise(PEXP, { type: 'bandpass', f: 3200, f2: 200, dur: 1.5, g: 0.15, rev: 0.6 });
      A.whoosh(PEXP + 0.02, 1.0, { f1: 4200, f2: 300, g: 0.11, swell: 0.1 });
      // stream
      A.chord(8.0, [43, 50, 55, 59, 62, 66], { type: 'sine', dur: 1.95, g: 0.035, a: 0.6, hold: true, rel: 1.0, width: 1.4, rev: 0.6 });
      [67, 71, 74, 78, 79, 83].forEach((m, k) => A.pluck(8.1 + k * 0.22, midi(m), { g: 0.11, dur: 1.4, bright: 0.55, rev: 0.5, pan: (k / 5 - 0.5) * 1.2 }));
      A.bell(8.65, midi(91), { g: 0.04, dur: 1.3 });
    },
  });

  /* ============ 13 FUI — sci-fi targeting HUD ============ */
  const HC = { cy: [96, 244, 255], am: [255, 178, 60], rd: [255, 74, 54], wh: [225, 252, 255] };
  const HX = 960, HY = 520, H_LOCK = 7.3;
  const H_GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$/<>*+=';
  function scramble(s, t, t0, dur, seed = 0) {
    if (t < t0) return '';
    const p = (t - t0) / dur, f = Math.floor(t * 30);
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const u = i / s.length;
      if (p < u * 0.5) break;
      const ch = s[i];
      out += (p >= 0.35 + u * 0.65 || ch === ' ' || ch === '.') ? ch : H_GLY[Math.floor(hash(f * 13.1 + i * 7.7 + seed) * H_GLY.length)];
    }
    return out;
  }
  const H_BOOT = [
    '> BOOT SEQ INIT ............ OK', '> CORE v4.21.7  64-CH ....... OK', '> OPTIC ARRAY CALIBRATE ..... OK', '> GYRO STABILISER ...... NOMINAL',
    '> LIDAR ................ ONLINE', '> THERMAL 8-14UM ............ OK', '> NAV FIX ........ 3D / 12 SAT', '> UPLINK ............... SECURE',
    '> TRACK FILTER KALMAN ....... OK', '> HUD RENDER 120HZ ........... OK', '> ALL SYSTEMS NOMINAL',
  ];
  const H_CONT = (() => {
    const r = rng(41), ids = ['C-0213', 'C-1187', 'OBJ-0471', 'C-0552', 'C-2290', 'C-0046'];
    return ids.map((id, k) => ({ id, a: k === 2 ? -0.75 : r() * TAU, r: k === 2 ? 150 : 50 + r() * 140, brg: k === 2 ? '041.6' : (r() * 360).toFixed(1).padStart(5, '0'), rng: (2 + r() * 18).toFixed(2) }));
  })();
  function hudTarget(t) {
    const p0x = HX + Math.cos(-0.75) * 150 + vnoise(t * 0.4, 3) * 6, p0y = HY + Math.sin(-0.75) * 150 + vnoise(t * 0.4, 4) * 6;
    const k = E.ioC(seg(t, 5.6, 7.15)), j = seg(t, 5.6, 5.9) * (1 - seg(t, 6.75, 7.2));
    return [lerp(p0x, HX, k) + vnoise(t * 3.2, 5) * 36 * j, lerp(p0y, HY, k) + vnoise(t * 2.7, 9) * 30 * j];
  }

  MG.film({
    id: 'hud', dur: 10, poster: 9.4,
    fonts: [['700 22px Rajdhani', 'Aa1'], ['500 18px Rajdhani', 'Aa1'], ['800 130px "JetBrains Mono"', 'LOCKED'], ['400 14px "JetBrains Mono"', 'Aa1>.°%']],
    meta: {
      cn: '科幻界面', en: 'FUI / Sci-Fi HUD', era: '2008 —',
      origin: 'Fantasy User Interface：为电影虚构却可信的界面；《钢铁侠》（2008）头盔 HUD 之后成为科幻片标配',
      works: '代表作：Territory Studio《火星救援》《银翼杀手 2049》屏幕图形；Prologue / Cantina Creative《钢铁侠》系列头盔 HUD',
      tech: ['分段旋转环 + 刻度盘', '字符解码 / 乱码滚动', '雷达扫描、准星追踪与锁定'],
      accent: '#60f4ff',
    },
    setup() {
      const L = offscreen(1920, 1080), B = offscreen(480, 270);
      return { L, g: L.getContext('2d'), B, bg: B.getContext('2d') };
    },
    draw(c, t, W, H, st) {
      const g = st.g, f = Math.floor(t * 30);
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      const alert = seg(t, 5.55, 5.75) * (1 - seg(t, H_LOCK, H_LOCK + 0.2));
      const locked = t >= H_LOCK;
      const pc = mix3(HC.cy, HC.am, alert * 0.9);
      const P = (a) => rgb(pc, a);
      const AM = (a) => rgb(HC.am, a);
      const RD = (a) => rgb(HC.rd, a);
      const T = (s, x, y, size, col, o = {}) => text(g, s, x, y, { font: MONO, size, color: col, ...o });
      const RJ = (s, x, y, size, col, o = {}) => text(g, s, x, y, { font: 'Rajdhani, sans-serif', weight: 700, size, color: col, ...o });
      const line = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
      const arc = (x, y, r, a0, a1) => { g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); };
      const focus = 1 - 0.45 * seg(t, H_LOCK + 0.2, H_LOCK + 0.8);
      const tau = t + 2.4 * clamp(t - 5.6, 0, H_LOCK - 5.6);
      const tauL = H_LOCK + 2.4 * (H_LOCK - 5.6);
      const unwind = 1 - E.outQt(seg(t, H_LOCK, H_LOCK + 0.65));
      const rot = w => (t < H_LOCK ? w * tau : w * tauL * unwind + w * 0.06 * (t - H_LOCK));

      // grid
      const gi = seg(t, 0.3, 1.0) * focus;
      if (gi > 0) {
        g.strokeStyle = P(0.035 * gi); g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x <= W; x += 64) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); }
        for (let y = 8; y <= H; y += 64) { g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); }
        g.stroke();
        g.fillStyle = P(0.18 * gi);
        for (let x = 0; x <= W; x += 128) for (let y = 8; y <= H; y += 128) { g.fillRect(x - 3, y, 7, 1); g.fillRect(x, y - 3, 1, 7); }
      }
      // corner brackets
      const cb = E.outB(seg(t, 0.45, 0.8));
      if (cb > 0) {
        g.strokeStyle = P(0.8); g.lineWidth = 2;
        const m = 40 + (1 - cb) * 40, s = 70;
        [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
          g.beginPath(); g.moveTo(x, y + sy * s); g.lineTo(x, y); g.lineTo(x + sx * s, y); g.stroke();
          g.fillStyle = P(0.8); g.fillRect(x + sx * 8 - (sx < 0 ? 6 : 0), y + sy * 8 - (sy < 0 ? 6 : 0), 6, 6);
        });
      }
      // header
      const hd = seg(t, 0.7, 1.0);
      if (hd > 0) {
        RJ(scramble('OPTIC-7  //  TACTICAL TARGETING SUITE', t, 0.7, 0.6, 1), 112, 84, 22, P(0.9), { ls: 4 });
        const st1 = t < 4.0 ? 'SCANNING' : t < 5.6 ? 'TRACKING' : t < H_LOCK ? 'ALERT' : 'LOCKED';
        const sc = t < 4.0 ? P(0.9) : t < 5.6 ? P(0.9) : t < H_LOCK ? RD(f % 6 < 3 ? 1 : 0.4) : AM(1);
        const tc = `T+00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`;
        T(tc, W - 112, 84, 16, P(0.7), { align: 'right', ls: 2 });
        T('STATUS', W - 560, 84, 13, P(0.5), { ls: 3 });
        RJ(st1, W - 480, 85, 22, sc, { ls: 5 });
      }
      // heading tape / alert banner (top centre)
      const tapeA = seg(t, 0.9, 1.3) * (1 - alert);
      const hdg = 212.4 + vnoise(t * 0.5, 2) * 6 + alert * vnoise(t * 6, 3) * 10;
      if (tapeA > 0) {
        g.save(); g.beginPath(); g.rect(700, 40, 520, 70); g.clip();
        g.strokeStyle = P(0.6 * tapeA); g.lineWidth = 1.5;
        for (let d = Math.floor(hdg - 24); d <= hdg + 24; d++) {
          const x = HX + (d - hdg) * 11;
          if (d % 5) continue;
          line(x, 100, x, d % 10 ? 92 : 84);
          if (d % 10 === 0) T(String((d + 360) % 360).padStart(3, '0'), x, 76, 12, P(0.6 * tapeA), { align: 'center' });
        }
        g.restore();
        g.fillStyle = P(tapeA); g.beginPath(); g.moveTo(HX, 104); g.lineTo(HX - 6, 112); g.lineTo(HX + 6, 112); g.fill();
        g.strokeStyle = P(0.4 * tapeA); line(700, 104, 1220, 104);
        T(hdg.toFixed(1) + '°', HX, 134, 15, P(0.9 * tapeA), { align: 'center' });
      }
      if (alert > 0) {
        const bw = 560 * E.outX(seg(t, 5.55, 5.8)), on = f % 8 < 5;
        g.save(); g.beginPath(); g.rect(HX - bw / 2, 52, bw, 58); g.clip();
        g.fillStyle = RD(0.16 * alert); g.fillRect(HX - bw / 2, 52, bw, 58);
        g.fillStyle = RD(0.5 * alert);
        for (let x = -40; x < 600; x += 28) { const x0 = HX - 280 + x + ((t * 60) % 28); g.beginPath(); g.moveTo(x0, 52); g.lineTo(x0 + 12, 52); g.lineTo(x0 - 4, 62); g.lineTo(x0 - 16, 62); g.fill(); g.beginPath(); g.moveTo(x0, 100); g.lineTo(x0 + 12, 100); g.lineTo(x0 - 4, 110); g.lineTo(x0 - 16, 110); g.fill(); }
        g.strokeStyle = RD(0.9 * alert); g.lineWidth = 1.5; g.strokeRect(HX - bw / 2 + 0.5, 52.5, bw - 1, 57);
        if (on) RJ(scramble('WARNING  //  PROXIMITY ALERT', t, 5.6, 0.4, 9), HX, 93, 26, RD(alert), { ls: 6, align: 'center' });
        g.restore();
      }

      // ---- centre cluster ----
      const ringIn = k => E.outC(seg(t, 0.6 + k * 0.1, 1.2 + k * 0.1));
      g.save(); g.translate(HX, HY); g.globalAlpha = 1 - 0.4 * seg(t, H_LOCK + 0.2, H_LOCK + 0.8);
      // radar
      const radA = seg(t, 1.0, 1.5) * (1 - 0.6 * seg(t, H_LOCK, H_LOCK + 0.6));
      const RR = 205;
      if (ringIn(0) > 0) {
        const ri = ringIn(0);
        const fillG = g.createRadialGradient(0, 0, 0, 0, 0, RR);
        fillG.addColorStop(0, P(0.0)); fillG.addColorStop(1, P(0.07 * ri));
        g.fillStyle = fillG; g.beginPath(); g.arc(0, 0, RR, 0, TAU); g.fill();
        g.strokeStyle = P(0.75 * ri); g.lineWidth = 1.5; arc(0, 0, RR, -Math.PI / 2, -Math.PI / 2 + TAU * ri);
        g.strokeStyle = P(0.2 * ri); g.lineWidth = 1;
        arc(0, 0, RR / 3, 0, TAU); arc(0, 0, RR * 2 / 3, 0, TAU);
        line(-RR * ri, 0, RR * ri, 0); line(0, -RR * ri, 0, RR * ri);
      }
      const sw = (tau - 1.3) * TAU * 0.72;
      if (radA > 0 && t > 1.3) {
        const cg = g.createConicGradient(sw - 1.3, 0, 0);
        cg.addColorStop(0, P(0)); cg.addColorStop(0.75 / TAU, P(0.04 * radA)); cg.addColorStop(1.18 / TAU, P(0.1 * radA)); cg.addColorStop(1.3 / TAU, P(0.24 * radA)); cg.addColorStop(1.3 / TAU + 0.002, P(0)); cg.addColorStop(1, P(0));
        g.fillStyle = cg; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, RR - 2, 0, TAU); g.fill();
        g.strokeStyle = P(0.9 * radA); g.lineWidth = 1.5; line(0, 0, Math.cos(sw) * RR, Math.sin(sw) * RR);
        H_CONT.forEach((ct, k) => {
          if (k === 2 && t >= 4.0) return;
          const a = ct.a + t * 0.02 * (k % 2 ? 1 : -1), d = (((sw - a) % TAU) + TAU) % TAU;
          const br = Math.exp(-d * 1.1) * radA;
          if (br < 0.02) return;
          const x = Math.cos(a) * ct.r, y = Math.sin(a) * ct.r;
          g.fillStyle = P(br); g.fillRect(x - 3, y - 3, 6, 6);
          g.strokeStyle = P(br * 0.5); g.strokeRect(x - 8.5, y - 8.5, 17, 17);
          T(ct.id, x + 13, y - 8, 11, P(br * 0.8));
        });
      }
      // tick ring
      if (ringIn(1) > 0) {
        const n = 120, shown = Math.floor(n * ringIn(1)), ro = rot(0.12);
        g.strokeStyle = P(0.55); g.lineWidth = 1.2;
        g.beginPath();
        for (let k = 0; k < shown; k++) {
          const a = ro + k / n * TAU, l = k % 10 === 0 ? 14 : k % 5 === 0 ? 9 : 5;
          g.moveTo(Math.cos(a) * 226, Math.sin(a) * 226); g.lineTo(Math.cos(a) * (226 + l), Math.sin(a) * (226 + l));
        }
        g.stroke();
      }
      // segmented ring
      if (ringIn(2) > 0) {
        const ro = rot(-0.22), ri = ringIn(2);
        g.lineWidth = 8;
        for (let k = 0; k < 36 * ri; k++) {
          const a = ro + k / 36 * TAU;
          g.strokeStyle = k % 6 === 0 ? P(0.85) : P(0.28 + 0.12 * (alert * (f + k) % 2));
          arc(0, 0, 268, a + 0.02, a + TAU / 36 - 0.035);
        }
      }
      // thin ring + brackets
      if (ringIn(3) > 0) {
        const ro = rot(0.4), ri = ringIn(3);
        g.strokeStyle = P(0.3); g.lineWidth = 1; arc(0, 0, 305, 0, TAU * ri);
        g.strokeStyle = locked ? AM(0.9) : P(0.9); g.lineWidth = 3.5;
        for (let k = 0; k < 3; k++) { const a = ro + k * TAU / 3; arc(0, 0, 305, a, a + 0.7 * ri); }
        g.fillStyle = P(0.9);
        for (let k = 0; k < 3; k++) { const a = ro + k * TAU / 3 + 0.7 * ri; g.fillRect(Math.cos(a) * 305 - 3, Math.sin(a) * 305 - 3, 6, 6); }
      }
      // degree scale
      if (ringIn(4) > 0) {
        const ro = rot(-0.05), ri = ringIn(4);
        g.strokeStyle = P(0.45); g.lineWidth = 1;
        g.beginPath();
        for (let d = 0; d < 360 * ri; d += 5) {
          const a = ro + d / 180 * Math.PI, l = d % 30 === 0 ? 10 : 4;
          g.moveTo(Math.cos(a) * 345, Math.sin(a) * 345); g.lineTo(Math.cos(a) * (345 - l), Math.sin(a) * (345 - l));
        }
        g.stroke();
        for (let d = 0; d < 360 * ri; d += 30) {
          const a = ro + d / 180 * Math.PI;
          g.save(); g.translate(Math.cos(a) * 362, Math.sin(a) * 362); g.rotate(a + Math.PI / 2);
          T(String(d).padStart(3, '0'), 0, 4, 11, P(0.6), { align: 'center' });
          g.restore();
        }
      }
      // outer partial arcs
      if (ringIn(5) > 0) {
        const ri = ringIn(5), br = 0.06 * Math.sin(t * 2);
        g.strokeStyle = P(0.6); g.lineWidth = 2;
        [Math.PI, 0].forEach(c0 => { arc(0, 0, 395, c0 - (0.5 + br) * ri, c0 + (0.5 + br) * ri); });
        g.lineWidth = 1; g.strokeStyle = P(0.35);
        [Math.PI, 0].forEach(c0 => { arc(0, 0, 405, c0 - 0.3 * ri, c0 + 0.3 * ri); });
        T('RNG', -420, -6, 11, P(0.6), { align: 'right' });
        T('ELV', 420, -6, 11, P(0.6));
      }
      g.restore();

      // ---- target + reticle ----
      const [tx, ty] = hudTarget(t);
      if (t >= 4.0) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 18);
        g.save(); g.translate(tx, ty); g.rotate(Math.PI / 4);
        g.fillStyle = locked ? AM(1) : AM(pulse); g.fillRect(-5, -5, 10, 10);
        g.restore();
        const lagP = hudTarget(Math.max(4.0, t - 0.12));
        const tr = E.outB(seg(t, 4.0, 4.55), 1.3);
        let rx = lerp(HX, lagP[0], tr), ry = lerp(HY, lagP[1], tr);
        if (locked) { rx = tx; ry = ty; }
        const sq = kf(t, [[4.0, 170], [4.55, 64, E.outQt], [5.6, 64], [H_LOCK, 40, E.inQ]]);
        const open = E.outQt(seg(t, 7.45, 7.85));
        const bw = lerp(sq, 470, open), bh = lerp(sq, 112, open), rr = (1 - tr) * Math.PI / 2 * (1 - open);
        const snap = locked ? Math.exp(-(t - H_LOCK) * 10) * 14 : 0;
        // crosshair lines to the frame edges
        g.strokeStyle = (alert ? RD : P)(0.14 * focus); g.lineWidth = 1;
        line(0, ry, rx - bw - 20, ry); line(rx + bw + 20, ry, W, ry);
        line(rx, 0, rx, ry - bh - 20); line(rx, ry + bh + 20, rx, H);
        g.save(); g.translate(rx, ry); g.rotate(rr);
        g.strokeStyle = locked ? AM(1) : alert ? RD(0.95) : P(0.95); g.lineWidth = 3;
        const L2 = Math.min(28, bw * 0.45) + open * 20;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
          const x = sx * (bw + snap), y = sy * (bh + snap);
          g.beginPath(); g.moveTo(x, y - sy * L2); g.lineTo(x, y); g.lineTo(x - sx * L2, y); g.stroke();
        });
        if (open < 0.5) {
          g.lineWidth = 1.5; line(-12, 0, -4, 0); line(4, 0, 12, 0); line(0, -12, 0, -4); line(0, 4, 0, 12);
        }
        g.restore();
        // lock progress
        if (t >= 5.6 && t < H_LOCK + 0.15) {
          const prog = E.inQ(seg(t, 5.6, H_LOCK)), R2 = sq + 26;
          g.strokeStyle = RD(0.25); g.lineWidth = 3; arc(rx, ry, R2, 0, TAU);
          g.strokeStyle = RD(1); g.lineWidth = 3; arc(rx, ry, R2, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
          T('LOCK ' + String(Math.floor(prog * 100)).padStart(2, '0') + '%', rx, ry + R2 + 26, 14, RD(0.95), { align: 'center', ls: 2 });
        }
        // callout
        if (t < H_LOCK) {
          const ca = seg(t, 4.3, 4.5);
          const ox = rx + sq + 30, oy = ry - sq - 30;
          g.strokeStyle = AM(0.8 * ca); g.lineWidth = 1.2; line(rx + sq * 0.7, ry - sq * 0.7, ox, oy); line(ox, oy, ox + 170 * ca, oy);
          const rngv = lerp(3.82, 0.41, E.ioC(seg(t, 5.6, 7.15))).toFixed(2);
          T(scramble('OBJ-0471', t, 4.3, 0.4, 3), ox + 4, oy - 8, 15, AM(0.95 * ca), { ls: 2 });
          T(scramble('RNG ' + rngv + ' KM', t, 4.45, 0.4, 4), ox + 4, oy + 20, 13, AM(0.75 * ca));
        }
        // shockwave
        if (locked && t < H_LOCK + 1) {
          const k = t - H_LOCK;
          g.strokeStyle = AM(0.8 * Math.exp(-k * 4)); g.lineWidth = 3;
          arc(tx, ty, 40 + E.outC(seg(k, 0, 1)) * 900, 0, TAU);
        }
      }

      // ---- left panel: boot log → telemetry ----
      const LX = 80;
      const bootA = 1 - seg(t, 2.3, 2.6);
      if (bootA > 0 && t > 0.3) {
        const scroll = E.ioC(seg(t, 2.3, 2.6)) * 60;
        H_BOOT.forEach((s, i) => {
          const t0 = 0.35 + i * 0.13;
          const str = scramble(s, t, t0, 0.3, i);
          if (!str) return;
          const last = i === H_BOOT.length - 1;
          T(str, LX, 180 + i * 28 - scroll, 15, last ? AM(bootA) : P(0.8 * bootA));
        });
        if (f % 10 < 5) { const n = Math.min(H_BOOT.length - 1, Math.floor((t - 0.35) / 0.13)); g.fillStyle = P(bootA); g.fillRect(LX, 186 + n * 28 - scroll, 10, 3); }
      }
      const telA = seg(t, 2.45, 2.85) * focus;
      if (telA > 0) {
        RJ(scramble('TELEMETRY  //  07', t, 2.45, 0.4, 20), LX, 180, 20, P(telA), { ls: 4 });
        g.strokeStyle = P(0.4 * telA); g.lineWidth = 1; line(LX, 194, LX + 380, 194);
        const ROWS = [
          ['ALT', 4212.7 + vnoise(t * 0.8, 1) * 30, 1, 'M', 0.62], ['SPD', 0.81 + vnoise(t * 1.2, 2) * 0.03 + alert * 0.2, 2, 'MACH', 0.4],
          ['HDG', hdg, 1, 'DEG', hdg / 360], ['PITCH', -2.31 + vnoise(t * 2, 3) * (1 + alert * 6), 2, 'DEG', 0.5], ['TEMP', -41.2 + vnoise(t, 4), 1, 'C', 0.3],
          ['PWR', 98.2 - alert * 14 + vnoise(t * 3, 6) * 0.4, 1, '%', 0.96 - alert * 0.15],
        ];
        ROWS.forEach(([lab, v, dp, unit, fill], i) => {
          const ra = seg(t, 2.5 + i * 0.07, 2.8 + i * 0.07) * focus;
          if (ra <= 0) return;
          const y = 236 + i * 46;
          T(lab, LX, y, 13, P(0.55 * ra), { ls: 2 });
          T(v.toFixed(dp), LX + 230, y + 2, 22, i === 5 && alert ? RD(ra) : P(ra), { align: 'right', weight: 800 });
          T(unit, LX + 238, y, 11, P(0.5 * ra));
          const nS = 12, fl = Math.round(clamp(fill + vnoise(t * 2 + i, 7) * 0.08) * nS);
          for (let k = 0; k < nS; k++) { g.fillStyle = k < fl ? (alert && k > 8 ? RD(0.9 * ra) : P(0.85 * ra)) : P(0.15 * ra); g.fillRect(LX + 290 + k * 8, y - 12, 5, 12); }
        });
        // sparkline
        const sy = 530, sa = seg(t, 2.9, 3.2) * focus;
        if (sa > 0) {
          g.strokeStyle = P(0.35 * sa); g.lineWidth = 1; g.strokeRect(LX + 0.5, sy + 0.5, 380, 120);
          for (let k = 1; k < 4; k++) { g.strokeStyle = P(0.08 * sa); line(LX, sy + k * 30, LX + 380, sy + k * 30); }
          T('SIGNAL HISTORY', LX + 8, sy + 18, 11, P(0.55 * sa), { ls: 2 });
          g.strokeStyle = P(0.95 * sa); g.lineWidth = 1.5; g.beginPath();
          for (let k = 0; k <= 95; k++) {
            const tt = t - (95 - k) * 0.03;
            const v = 0.5 + 0.28 * vnoise(tt * 3, 11) + 0.12 * Math.sin(tt * 9) + (tt > 5.6 && tt < H_LOCK ? 0.25 * vnoise(tt * 14, 12) : 0);
            const x = LX + 4 + k * 3.9 * seg(t, 2.9, 3.4), y = sy + 112 - clamp(v) * 100;
            k ? g.lineTo(x, y) : g.moveTo(x, y);
          }
          g.stroke();
        }
      }

      // ---- right panel: contacts + target data ----
      const RX = 1460;
      const rpA = seg(t, 1.5, 1.8) * focus;
      if (rpA > 0) {
        RJ(scramble('CONTACTS  //  06', t, 1.5, 0.4, 30), RX, 180, 20, P(rpA), { ls: 4 });
        g.strokeStyle = P(0.4 * rpA); g.lineWidth = 1; line(RX, 194, RX + 380, 194);
        H_CONT.forEach((ct, k) => {
          const t0 = 1.6 + k * 0.09;
          if (t < t0) return;
          const y = 226 + k * 30, isT = k === 2 && t >= 4.0;
          if (isT) { g.fillStyle = AM((t < 4.6 ? (f % 6 < 3 ? 0.3 : 0.08) : 0.18) * focus); g.fillRect(RX - 8, y - 18, 396, 26); }
          const col = isT ? AM(rpA) : P(0.8 * rpA);
          T(scramble(ct.id, t, t0, 0.3, k), RX, y, 14, col);
          T(scramble('BRG ' + ct.brg, t, t0 + 0.05, 0.3, k + 5), RX + 120, y, 14, col);
          T(scramble((k === 2 ? lerp(3.82, 0.41, E.ioC(seg(t, 5.6, 7.15))).toFixed(2) : ct.rng) + 'KM', t, t0 + 0.1, 0.3, k + 9), RX + 380, y, 14, col, { align: 'right' });
        });
        const tdA = seg(t, 4.15, 4.35) * focus;
        if (tdA > 0) {
          const by = 430;
          g.strokeStyle = AM(0.6 * tdA); g.lineWidth = 1; g.strokeRect(RX - 8.5, by - 30.5, 397, 236);
          g.fillStyle = AM(0.85 * tdA); g.fillRect(RX - 8, by - 30, 397, 4);
          RJ(scramble('TARGET  //  OBJ-0471', t, 4.15, 0.4, 40), RX, by, 20, AM(tdA), { ls: 4 });
          const rngv = lerp(3.82, 0.41, E.ioC(seg(t, 5.6, 7.15))).toFixed(2);
          const TD = [['CLASS', 'UNKNOWN'], ['BEARING', '041.6°'], ['RANGE', rngv + ' KM'], ['VELOCITY', (0.81 + alert * 0.2).toFixed(2) + ' M'], ['SIGNATURE', 'IR / RF'], ['SOLUTION', locked ? 'LOCKED' : t >= 5.6 ? 'ACQUIRING' : 'PENDING']];
          TD.forEach(([k2, v], i) => {
            const t0 = 4.3 + i * 0.1;
            T(scramble(k2, t, t0, 0.3, 50 + i), RX, by + 36 + i * 28, 13, AM(0.6 * tdA), { ls: 2 });
            const vc = i === 5 && t >= 5.6 && !locked ? RD(f % 8 < 4 ? 1 : 0.5) : AM(tdA);
            T(scramble(v, t, t0 + 0.08, 0.3, 60 + i), RX + 380, by + 36 + i * 28, 14, vc, { align: 'right', weight: i === 5 ? 800 : 400 });
          });
        }
        const thA = seg(t, 5.6, 5.8) * focus;
        if (thA > 0) {
          const y = 720, lev = locked ? 1 : E.inQ(seg(t, 5.6, H_LOCK));
          const TC = locked ? AM : RD;
          T('THREAT', RX, y, 13, TC(0.8 * thA), { ls: 3 });
          for (let k = 0; k < 20; k++) { g.fillStyle = k < lev * 20 ? TC(0.95 * thA) : TC(0.15 * thA); g.fillRect(RX + 90 + k * 14.5, y - 13, 10, 14); }
          if (!locked) T(scramble('EVASIVE PATTERN DETECTED', t, 5.75, 0.5, 70), RX, y + 32, 13, RD(thA * (f % 10 < 6 ? 0.9 : 0.4)), { ls: 2 });
          else T(scramble('HOSTILE TRACK HELD', t, H_LOCK + 0.1, 0.5, 71), RX, y + 32, 13, AM(thA * 0.9), { ls: 2 });
        }
      }

      // ---- bottom: oscilloscope ----
      const wA = seg(t, 1.8, 2.2) * focus;
      if (wA > 0) {
        const x0 = 600, x1 = 1320, wy = 985;
        g.strokeStyle = P(0.3 * wA); g.lineWidth = 1;
        line(x0, wy - 38, x0, wy + 38); line(x1, wy - 38, x1, wy + 38); line(x0, wy, x1, wy);
        for (let x = x0; x <= x1; x += 36) line(x, wy - 4, x, wy + 4);
        const amp = 0.22 + 0.25 * bump(t, 4.0, 0.05, 0.1, 0.5) + alert * (0.5 + 0.3 * vnoise(t * 9, 13)) + (locked ? 0.9 * Math.exp(-(t - H_LOCK) * 3) : 0) + 0.06;
        [[0.25, 0.08], [1, 0]].forEach(([a, lag]) => {
          g.strokeStyle = (alert > 0.5 ? RD : P)(a * wA); g.lineWidth = a < 1 ? 1 : 1.6;
          g.beginPath();
          for (let k = 0; k <= 240; k++) {
            const u = k / 240, tt = t - lag, x = lerp(x0, x1, u * seg(t, 1.8, 2.3));
            const y = wy - 34 * amp * Math.sin(Math.PI * u) * (Math.sin(u * 22 + tt * 14) * 0.5 + Math.sin(u * 61 - tt * 23) * 0.3 + vnoise(u * 40 + tt * 30, 14) * 0.45);
            k ? g.lineTo(x, y) : g.moveTo(x, y);
          }
          g.stroke();
        });
        T('SIG ' + (47.2 + vnoise(t * 4, 15) * 3 + alert * 9).toFixed(1) + ' dB', x0, wy - 48, 12, P(0.6 * wA), { ls: 2 });
        T('2.418 GHz  ·  CH 07', x1, wy - 48, 12, P(0.6 * wA), { ls: 2, align: 'right' });
      }

      // ---- LOCKED resolve ----
      if (t >= 7.45) {
        const open = E.outQt(seg(t, 7.45, 7.85));
        const pw = 450 * open, ph = 108;
        g.fillStyle = 'rgba(2,8,10,0.82)'; g.fillRect(HX - pw, HY - ph, pw * 2, ph * 2);
        g.fillStyle = AM(0.07 * open); g.fillRect(HX - pw, HY - ph, pw * 2, ph * 2);
        g.strokeStyle = AM(0.5 * open); g.lineWidth = 1;
        line(HX - pw, HY - ph + 16, HX + pw, HY - ph + 16); line(HX - pw, HY + ph - 16, HX + pw, HY + ph - 16);
        const word = scramble('LOCKED', t, 7.55, 0.6, 99);
        T(word, HX + 18, HY + 46, 130, AM(1), { weight: 800, ls: 36, align: 'center' });
        const la = seg(t, 7.9, 8.2);
        T(scramble('TGT  OBJ-0471', t, 7.9, 0.4, 101), HX - pw + 24, HY - ph + 10, 12, AM(0.8 * la), { ls: 3 });
        T(scramble('CONF 99.7%', t, 7.95, 0.4, 102), HX + pw - 24, HY - ph + 10, 12, AM(0.8 * la), { ls: 3, align: 'right' });
        T(scramble('TRACK SOLUTION STABLE  ·  FIRE CONTROL READY', t, 8.15, 0.6, 103), HX, HY + ph + 44, 14, AM(0.85 * la), { ls: 4, align: 'center' });
        T(scramble('科幻界面  ·  FUI / HUD', t, 8.6, 0.5, 104), HX, HY + ph + 76, 14, P(0.6 * seg(t, 8.6, 8.9)), { ls: 4, align: 'center' });
      }

      // ---- composite: bg, bloom, sharp layer, alarms ----
      c.fillStyle = '#020709'; c.fillRect(0, 0, W, H);
      const bgG = c.createRadialGradient(HX, HY, 0, HX, HY, 1000);
      bgG.addColorStop(0, alert > 0 ? rgb(mix3([10, 40, 50], [60, 18, 10], alert), 1) : 'rgba(10,40,50,1)'); bgG.addColorStop(1, 'rgba(2,7,9,0)');
      c.fillStyle = bgG; c.fillRect(0, 0, W, H);
      st.bg.clearRect(0, 0, 480, 270); st.bg.drawImage(st.L, 0, 0, 480, 270);
      c.save();
      const flick = t < 1.2 ? 0.75 + 0.25 * hash(f * 3.1) : 1;
      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(6px)'; c.globalAlpha = 0.9 * flick; c.drawImage(st.B, 0, 0, W, H);
      c.filter = 'blur(2px)'; c.globalAlpha = 0.5 * flick; c.drawImage(st.B, 0, 0, W, H);
      c.filter = 'none'; c.globalCompositeOperation = 'source-over'; c.globalAlpha = flick;
      c.drawImage(st.L, 0, 0);
      c.restore();
      if (alert > 0) {
        const pul = alert * (0.5 + 0.5 * Math.sin(t * TAU * 2.5));
        const eg = c.createRadialGradient(HX, H / 2, H * 0.4, HX, H / 2, H * 1.05);
        eg.addColorStop(0, 'rgba(255,40,20,0)'); eg.addColorStop(1, `rgba(255,40,20,${0.32 * pul})`);
        c.fillStyle = eg; c.fillRect(0, 0, W, H);
      }
      if (locked && t < H_LOCK + 0.5) { c.fillStyle = `rgba(255,236,200,${0.55 * Math.exp(-(t - H_LOCK) * 9)})`; c.fillRect(0, 0, W, H); }
      // scanlines
      c.fillStyle = 'rgba(0,0,0,0.16)';
      for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
      // CRT power-on
      if (t < 0.45) {
        const open = E.outC(seg(t, 0.1, 0.4)), hgt = Math.max(2, H * open);
        c.fillStyle = '#000';
        c.fillRect(0, 0, W, HY - hgt / 2); c.fillRect(0, HY + hgt / 2, W, H);
        const lw = W * E.outX(seg(t, 0, 0.12)), la = 1 - seg(t, 0.15, 0.45);
        const lg = c.createLinearGradient(HX - lw / 2, 0, HX + lw / 2, 0);
        lg.addColorStop(0, 'rgba(180,250,255,0)'); lg.addColorStop(0.5, `rgba(235,255,255,${la})`); lg.addColorStop(1, 'rgba(180,250,255,0)');
        c.fillStyle = lg; c.fillRect(HX - lw / 2, HY - 2 - (1 - la) * hgt * 0.02, lw, 4);
      }
      grain(c, W, H, t, 0.05, 'screen');
      vignette(c, W, H, 0.55);
    },
    score(A) {
      // CRT thump and whine
      A.osc(0.0, { f: 70, f2: 32, glide: 0.4, dur: 0.6, g: 0.4 });
      A.noise(0.0, { type: 'highpass', f: 2500, dur: 0.06, g: 0.15 });
      A.osc(0.1, { f: 7800, dur: 1.2, g: 0.006, a: 0.05 });
      A.osc(0.3, { type: 'sawtooth', f: 55, dur: 9.6, g: 0.04, a: 0.6, hold: true, rel: 0.6, lp: 260 });
      A.osc(0.3, { f: 110, dur: 9.6, g: 0.035, a: 1.0, hold: true, rel: 0.6 });
      // boot beeps
      H_BOOT.forEach((s, i) => A.osc(0.35 + i * 0.13, { type: 'square', f: i === H_BOOT.length - 1 ? 2093 : 1568 + (i % 3) * 196, dur: 0.035, g: 0.03, hold: true, rel: 0.01, lp: 5000 }));
      A.osc(0.6, { f: 300, f2: 1500, glide: 0.9, dur: 1.0, g: 0.025, a: 0.1, rev: 0.3 });
      [0.45, 0.8].forEach(x => A.noise(x, { type: 'bandpass', f: 4000, q: 2, dur: 0.04, g: 0.07 }));
      // sonar pings each sweep revolution
      for (let k = 0; ; k++) {
        const tp = 1.3 + k / 0.72;
        if (tp > 5.5) break;
        A.bell(tp, midi(83), { g: 0.06, dur: 1.8, ratios: [1, 2.01], rev: 0.7 });
      }
      // data chatter
      for (let k = 0; k < 70; k++) {
        const tt = 1.6 + k * 0.08;
        if (hash(k * 2.7) < 0.45) A.osc(tt, { type: 'square', f: 1200 + hash(k) * 2600, dur: 0.02, g: 0.012, hold: true, rel: 0.005, lp: 6000, pan: hash(k + 9) - 0.5 });
      }
      // acquire
      A.osc(4.0, { type: 'square', f: 1318, dur: 0.08, g: 0.04, hold: true, rel: 0.01, lp: 5000 });
      A.osc(4.1, { type: 'square', f: 1760, dur: 0.12, g: 0.04, hold: true, rel: 0.01, lp: 5000 });
      A.whoosh(4.0, 0.5, { f1: 600, f2: 3000, g: 0.06 });
      A.kick(4.0, 0.4);
      // alert: two-tone siren, heartbeat, lock beeps accelerating
      for (let k = 0; k * 0.25 < 1.7; k++) A.osc(5.6 + k * 0.25, { type: 'square', f: k % 2 ? 660 : 880, dur: 0.22, g: 0.035, hold: true, rel: 0.02, lp: 2200 });
      for (let k = 0; k < 4; k++) A.kick(5.6 + k * 0.45, 0.55);
      let tb = 5.65, gap = 0.22;
      while (tb < H_LOCK - 0.03) { A.osc(tb, { f: 2400, dur: 0.03, g: 0.035, hold: true, rel: 0.005 }); tb += gap; gap = Math.max(0.045, gap * 0.84); }
      A.riser(5.7, 1.6, { g: 0.13, f: 98 });
      // lock
      A.impact(H_LOCK, 0.85);
      A.noise(H_LOCK, { type: 'highpass', f: 3000, dur: 0.5, g: 0.1, rev: 0.4 });
      A.chord(H_LOCK, [50, 57, 62, 69, 74], { type: 'triangle', dur: 1.4, g: 0.035, rev: 0.6, width: 1.2 });
      A.osc(H_LOCK + 0.02, { type: 'square', f: 2637, dur: 0.18, g: 0.03, hold: true, rel: 0.02, lp: 6000 });
      A.whoosh(7.45, 0.4, { f1: 3000, f2: 500, g: 0.06, swell: 0.2 });
      for (let k = 0; k < 10; k++) A.osc(7.55 + k * 0.06, { type: 'square', f: 1600 + hash(k + 50) * 2000, dur: 0.02, g: 0.015, hold: true, rel: 0.005, lp: 6000 });
      A.osc(8.15, { type: 'square', f: 1975, dur: 0.06, g: 0.03, hold: true, rel: 0.01, lp: 5000 });
      A.osc(8.23, { type: 'square', f: 2637, dur: 0.14, g: 0.03, hold: true, rel: 0.01, lp: 5000 });
      A.chord(8.2, [38, 45, 50, 57, 62], { type: 'sine', dur: 1.75, g: 0.04, a: 0.4, hold: true, rel: 1.0, rev: 0.6, width: 1.2 });
    },
  });
})();
