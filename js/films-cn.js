/* Chinese short-video platform styles — 快闪 / 花字 / 国潮. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, font, rrect, roughPoly, grain, vignette } = MG;
  const NS = '"Noto Sans SC", "PingFang SC", sans-serif';
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));

  /* ============ 08 快闪 — one word per beat ============ */
  const FB = 60 / 128;
  const FW = [
    [0, '听', 'c'], [1, '节奏', 'c'], [2, '说话', 'inv'],
    [3, '一', 'q0'], [3.5, '字', 'q1'], [4, '一', 'q2'], [4.5, '拍', 'q3'],
    [5, '快', 'zoom'], [6, '准', 'inv'], [7, '狠', 'red'],
    [8, '字', 'c'], [8.5, '就是', 'sm'], [9, '画面', 'frame'],
    [10, '每一帧', 'drop'], [11, '都在', 'inv'], [12, '卡点', 'yel'],
    [13, '3', 'n'], [14, '2', 'n'], [15, '1', 'n'], [16, '快闪', 'final'],
  ];
  const Q = [[560, 360], [1360, 360], [560, 740], [1360, 740]];
  MG.film({
    id: 'flash',
    poster: 8.6,
    fonts: [['900 300px "Noto Sans SC"', '听节奏说话一字拍快准狠就是画面每帧都在卡点闪321'], ['800 40px "JetBrains Mono"', 'BPM0123456789/']],
    draw(c, t, W, H) {
      let idx = 0;
      FW.forEach((w, i) => { if (w[0] * FB <= t) idx = i; });
      const [bt, word, sty] = FW[idx];
      const lt = t - bt * FB;
      const punch = 1 + 0.14 * (1 - E.outQt(clamp(lt / 0.11)));
      let bg = '#0a0a0a', fg = '#f6f6f2';
      if (sty === 'inv') { bg = '#f6f6f2'; fg = '#0a0a0a'; }
      if (sty === 'red') { bg = '#ff2b2b'; }
      if (sty === 'yel') { bg = '#ffe600'; fg = '#0a0a0a'; }
      if (sty === 'n') { bg = ['#0a0a0a', '#f6f6f2', '#ffe600'][idx - 16]; fg = idx === 16 ? '#f6f6f2' : '#0a0a0a'; }
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const big = (s, x, y, size, col = fg, sc = punch) => {
        c.save(); c.translate(x, y); c.scale(sc, sc);
        text(c, s, 0, 0, { font: NS, weight: 900, size, align: 'center', base: 'middle', color: col });
        c.restore();
      };
      c.save();
      if (sty === 'red') { const a = 22 * Math.exp(-lt * 7), r = rng(Math.floor(t * 30)); c.translate((r() - 0.5) * a, (r() - 0.5) * a); }
      if (sty === 'c') big(word, W / 2, H / 2, word.length > 1 ? 330 : 420);
      else if (sty === 'inv') big(word, W / 2, H / 2, 360);
      else if (sty === 'red') big(word, W / 2, H / 2, 480, '#ffffff');
      else if (sty === 'yel') big(word, W / 2, H / 2, 380);
      else if (sty[0] === 'q') {
        for (let k = 3; k <= idx; k++) {
          const own = k === idx;
          big(FW[k][1], Q[k - 3][0], Q[k - 3][1], 300, own ? fg : 'rgba(246,246,242,0.28)', own ? punch : 1);
        }
        c.fillStyle = '#ffe600';
        c.fillRect(W / 2 - 4, 200, 8, 680 * E.outX(seg(t, 3 * FB, 3 * FB + 0.2)));
      } else if (sty === 'zoom') {
        const s = lerp(3.2, 1, E.outQt(clamp(lt / 0.16)));
        [1.5, 1.25].forEach((g, i) => { c.globalAlpha = 0.18 - i * 0.06; big(word, W / 2, H / 2, 440, fg, s * g); });
        c.globalAlpha = 1;
        big(word, W / 2, H / 2, 440, fg, s);
      } else if (sty === 'sm') {
        big('字', W / 2 - 330, H / 2, 200, 'rgba(246,246,242,0.3)', 1);
        big('就是', W / 2 + 80, H / 2, 170);
        c.fillStyle = '#ffe600'; c.fillRect(W / 2 - 110, H / 2 + 120, 380 * E.outX(clamp(lt / 0.2)), 10);
      } else if (sty === 'frame') {
        big(word, W / 2, H / 2, 330);
        const k = 1 - E.outX(clamp(lt / 0.18));
        c.strokeStyle = fg; c.lineWidth = 10;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
          const x = W / 2 + sx * (420 + k * 300), y = H / 2 + sy * (260 + k * 200);
          c.beginPath(); c.moveTo(x, y - sy * 90); c.lineTo(x, y); c.lineTo(x - sx * 90, y); c.stroke();
        });
        if (Math.floor(t * 4) % 2 === 0) { c.fillStyle = '#ff2b2b'; c.beginPath(); c.arc(W / 2 - 340, H / 2 - 200, 16, 0, TAU); c.fill(); }
      } else if (sty === 'drop') {
        font(c, 280, NS, 900);
        [...word].forEach((ch, i) => {
          const s = E.outX(clamp((lt - i * 0.05) / 0.14));
          big(ch, W / 2 + (i - 1) * 300, H / 2 - (1 - s) * 500, 280, fg, 1);
        });
      } else if (sty === 'n') {
        big(word, W / 2, H / 2 + 10, 560, fg, lerp(1.25, 1, E.outQt(clamp(lt / 0.14))));
        c.strokeStyle = idx === 18 ? '#ff2b2b' : fg; c.lineWidth = 18; c.lineCap = 'round';
        c.beginPath(); c.arc(W / 2, H / 2, 380, -Math.PI / 2, -Math.PI / 2 + TAU * E.outC(clamp(lt / FB))); c.stroke();
      } else if (sty === 'final') {
        const u = E.outX(seg(t, 7.5, 7.68));
        const ft = t - 7.5;
        const echo = seg(t, 7.9, 8.3);
        if (echo > 0) {
          const words = '听 节奏 说话 一字一拍 快 准 狠 字就是画面 每一帧 都在 卡点 ';
          for (let r = 0; r < 7; r++) {
            const off = ((t * 140 * (r % 2 ? 1 : -1) + r * 300) % 1400 + 1400) % 1400;
            for (let x = -off; x < W; x += 1400) text(c, words, x, 90 + r * 150, { font: NS, weight: 900, size: 92, color: `rgba(246,246,242,${0.07 * echo})` });
          }
        }
        const hl = E.ioX(seg(t, 7.72, 7.98));
        const pulse = 1 + 0.04 * Math.exp(-((ft + 1e-3) % (FB * 2)) * 10) * (t > 8 ? 1 : 0);
        c.fillStyle = '#ffe600';
        c.fillRect(W / 2 - 470, H / 2 + 20, 940 * hl, 150 * pulse);
        const shake = Math.exp(-Math.max(0, t - 7.68) * 9) * (t > 7.68 ? 14 : 0);
        c.translate(Math.sin(t * 90) * shake, 0);
        big('快', W / 2 - 220 - (1 - u) * 1300, H / 2 - 10, 420, fg, 1);
        big('闪', W / 2 + 220 + (1 - u) * 1300, H / 2 - 10, 420, fg, 1);
        const sub = seg(t, 8.05, 8.25);
        text(c, 'FLASH TYPE  ·  一字一拍  ·  128 BPM', W / 2, H / 2 + 300, { font: '"JetBrains Mono", monospace', weight: 800, size: 32, ls: 6, align: 'center', color: `rgba(246,246,242,${sub})` });
      }
      c.restore();
      // HUD drawn in difference mode so it reads on any background
      c.save();
      c.globalCompositeOperation = 'difference';
      const mono = '"JetBrains Mono", monospace';
      text(c, '128 BPM', 72, 92, { font: mono, weight: 800, size: 26, ls: 3, color: '#ffffff' });
      text(c, `BEAT ${String(Math.min(21, Math.floor(t / FB) + 1)).padStart(2, '0')}/21`, W - 72, 92, { font: mono, weight: 800, size: 26, ls: 3, align: 'right', color: '#ffffff' });
      for (let k = 0; k < 21; k++) {
        c.fillStyle = '#ffffff';
        const on = k <= Math.floor(t / FB);
        c.fillRect(72 + k * 85, H - 70, 70, on ? 10 : 3);
      }
      c.restore();
    },
    score(A) {
      const bassP = [45, 45, 41, 41, 48, 48, 43, 43];
      for (let b = 0; b < 16; b++) {
        const t = b * FB;
        A.kick(t, b >= 13 ? 1 : 0.85);
        if (b % 2 && b > 2) A.clap(t, 0.32);
        if (b >= 3) A.hat(t + FB / 2, 0.08);
        if (b >= 2) {
          const m = bassP[Math.floor(b / 2) % 8];
          A.osc(t, { type: 'sawtooth', f: midi(m - 12), dur: FB * 0.45, g: 0.1, lp: 700 });
          A.osc(t + FB / 2, { type: 'sawtooth', f: midi(m), dur: FB * 0.45, g: 0.07, lp: 900 });
        }
      }
      FW.forEach(([b, , sty], i) => {
        const t = b * FB;
        A.noise(t, { type: 'highpass', f: 2500, dur: 0.07, g: 0.12, pan: i % 2 ? 0.4 : -0.4 });
        if (sty === 'zoom') A.whoosh(t - 0.12, 0.2, { f1: 4000, f2: 400, g: 0.2, swell: 0.5 });
        if (sty === 'red') A.impact(t, 0.5);
        if (sty === 'n') A.osc(t, { f: b === 15 ? 1320 : 880, dur: 0.18, g: 0.12, type: 'square', lp: 3000 });
      });
      A.riser(12 * FB, 4 * FB, { g: 0.22 });
      A.impact(7.5, 1);
      A.noise(7.5, { type: 'highpass', f: 4000, dur: 2, g: 0.13, rev: 0.4 });
      A.chord(7.5, [57, 60, 64, 69], { type: 'sawtooth', dur: 2.4, g: 0.045, a: 0.01, hold: true, rel: 1.2, lp: 2400, spread: 12, rev: 0.4, width: 1.2 });
      [7.5, 7.5 + FB * 2, 7.5 + FB * 4].forEach(t => A.kick(t, 0.8));
      [7.5 + FB, 7.5 + FB * 3].forEach(t => A.clap(t, 0.3, { rev: 0.5 }));
      A.osc(7.5, { type: 'sawtooth', f: midi(33), dur: 2.4, g: 0.1, lp: 300, hold: true, rel: 1 });
    },
  });

  /* ============ 09 综艺花字 — variety-show captions ============ */
  const HZ = '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif';
  function hua(c, s, x, y, size, o) {
    c.save();
    c.translate(x, y); c.rotate(o.rot || 0);
    const sc = o.sc ?? 1; c.scale(sc, sc);
    if (o.skew) c.transform(1, 0, o.skew, 1, 0, 0);
    c.font = `400 ${size}px ${HZ}`;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = size * 0.3; c.strokeStyle = 'rgba(40,10,30,0.4)'; c.strokeText(s, size * 0.04, size * 0.08);
    c.strokeStyle = o.outer || '#ffffff'; c.strokeText(s, 0, 0);
    c.lineWidth = size * 0.15; c.strokeStyle = o.stroke; c.strokeText(s, 0, 0);
    const g = c.createLinearGradient(0, -size * 0.45, 0, size * 0.45);
    o.fill.forEach((col, i) => g.addColorStop(i / (o.fill.length - 1), col));
    c.fillStyle = g; c.fillText(s, 0, 0);
    c.save(); c.beginPath(); c.rect(-3000, -size * 0.5, 6000, size * 0.3); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillText(s, 0, 0); c.restore();
    c.restore();
  }
  function star4(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.28 : s; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  function crow(c, x, y, s, t) {
    const f = Math.sin(t * 16);
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#16141a';
    c.beginPath(); c.ellipse(0, 0, 46, 20, -0.1, 0, TAU); c.fill();
    c.beginPath(); c.arc(-44, -10, 16, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-58, -12); c.lineTo(-84, -4); c.lineTo(-58, -2); c.fill();
    c.beginPath(); c.moveTo(-10, -8); c.lineTo(30 * 0.4, -10 - 70 * f); c.lineTo(34, -6); c.fill();
    c.beginPath(); c.moveTo(40, -4); c.lineTo(78, -18); c.lineTo(76, 8); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-48, -14, 4, 0, TAU); c.fill();
    c.restore();
  }
  function studio(c, t, W, H, st) {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#3b2246'); g.addColorStop(0.55, '#a8466a'); g.addColorStop(1, '#f19a5a');
    c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
    st.bokeh.forEach(b => {
      const x = b.x + Math.sin(t * 0.3 + b.p) * 30, y = b.y + Math.cos(t * 0.25 + b.p) * 20;
      const rg = c.createRadialGradient(x, y, 0, x, y, b.r);
      rg.addColorStop(0, `hsla(${b.h},90%,75%,${b.a})`); rg.addColorStop(0.7, `hsla(${b.h},90%,70%,${b.a * 0.8})`); rg.addColorStop(1, `hsla(${b.h},90%,70%,0)`);
      c.fillStyle = rg; c.beginPath(); c.arc(x, y, b.r, 0, TAU); c.fill();
    });
    [[620, 0], [1300, 1]].forEach(([x, i]) => {
      const sway = Math.sin(t * 1.4 + i * 2) * 8;
      const sh = c.createRadialGradient(x + sway, 620, 40, x + sway, 700, 420);
      sh.addColorStop(0, 'rgba(30,14,34,0.75)'); sh.addColorStop(0.6, 'rgba(30,14,34,0.5)'); sh.addColorStop(1, 'rgba(30,14,34,0)');
      c.fillStyle = sh;
      c.beginPath(); c.arc(x + sway, 470, 110, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(x + sway, 900, 300, 260, 0, 0, TAU); c.fill();
    });
  }
  MG.film({
    id: 'huazi',
    poster: 9.3,
    fonts: [['400 200px "ZCOOL QingKe HuangYou"', '什么？！哈笑出鹅叫暴击×999空气突然安静。名场面MG奇妙夜嘎'], ['700 48px "Noto Sans SC"', '等一下他刚才说什么全场笑翻这太真实了本期名场面诞生（）…#花字综艺感嘎']],
    setup() {
      const r = rng(11);
      return { bokeh: Array.from({ length: 26 }, () => ({ x: r() * 1920, y: r() * 1080, r: 40 + r() * 120, h: [35, 330, 190, 50][Math.floor(r() * 4)], a: 0.12 + r() * 0.2, p: r() * 6 })) };
    },
    draw(c, t, W, H, st) {
      const quiet = t >= 6.5 && t < 8.2;
      const r = rng(Math.floor(t * 30));
      const shake = (t >= 0.9 && t < 1.4 ? 16 * Math.exp(-(t - 0.9) * 6) : 0) + (t >= 4.5 && t < 5.2 ? 26 * Math.exp(-(t - 4.5) * 5) : 0);
      const zoom = 1 + 0.025 * (t / 10) + (t >= 4.5 && t < 6.5 ? 0.08 * E.outX(seg(t, 4.5, 4.6)) * (1 - seg(t, 6.2, 6.5)) : 0);
      c.save();
      c.translate(W / 2 + (r() - 0.5) * shake, H / 2 + (r() - 0.5) * shake); c.scale(zoom, zoom); c.translate(-W / 2, -H / 2);
      studio(c, t, W, H, st);
      c.restore();
      if (quiet) {
        c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${E.outC(seg(t, 6.5, 6.8))})`; c.fillRect(0, 0, W, H); c.restore();
        c.fillStyle = `rgba(20,30,60,${0.3 * seg(t, 6.5, 6.8)})`; c.fillRect(0, 0, W, H);
      }
      // show bug
      const bug = spring(t - 0.15, 2.6, 0.45);
      if (bug > 0) {
        c.save(); c.translate(150, 90); c.scale(bug, bug); c.rotate(-0.05);
        c.fillStyle = '#ff4f9a'; rrect(c, -110, -38, 220, 76, 38); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 6; c.stroke();
        text(c, 'MG 奇妙夜', 0, 4, { font: HZ, size: 42, align: 'center', base: 'middle', color: '#fff' });
        c.restore();
      }
      // speed lines behind 什么
      if (t >= 0.9 && t < 2.45) {
        const a = seg(t, 0.9, 1.0) * (1 - seg(t, 2.25, 2.45));
        c.save(); c.translate(W / 2, 470); c.rotate(t * 0.4);
        c.fillStyle = `rgba(255,255,255,${0.55 * a})`;
        for (let i = 0; i < 36; i++) { const an = i / 36 * TAU, w = 0.03 + hash(i) * 0.03; c.beginPath(); c.moveTo(Math.cos(an) * 260, Math.sin(an) * 260); c.lineTo(Math.cos(an - w) * 1400, Math.sin(an - w) * 1400); c.lineTo(Math.cos(an + w) * 1400, Math.sin(an + w) * 1400); c.fill(); }
        c.restore();
      }
      if (t >= 0.9 && t < 2.5) {
        const s = spring(t - 0.9, 2.4, 0.32) * (1 - E.inB(seg(t, 2.3, 2.5)));
        if (s > 0) hua(c, '什么？！', W / 2, 470, 230, { sc: s, rot: -0.12 + Math.sin(t * 8) * 0.02, fill: ['#fff6a8', '#ffd21f', '#ff8a00'], stroke: '#5a2300' });
      }
      if (t >= 2.5 && t < 4.5) {
        const out = E.inB(seg(t, 4.3, 4.5));
        [...'哈哈哈哈哈'].forEach((ch, i) => {
          const s = spring(t - 2.5 - i * 0.06, 2.8, 0.4) * (1 - out);
          const wave = -Math.abs(Math.sin(t * 9 - i * 0.7)) * 46;
          if (s > 0) hua(c, ch, W / 2 + (i - 2) * 190, 440 + wave, 175, { sc: s, rot: (i % 2 ? 0.1 : -0.1), fill: ['#ffd1e6', '#ff7eb6', '#ff2f86'], stroke: '#6a1240' });
        });
        const tag = spring(t - 2.95, 2.6, 0.4) * (1 - out);
        if (tag > 0) {
          c.save(); c.translate(1500, 250); c.rotate(0.14); c.scale(tag, tag);
          c.fillStyle = '#ffe14d'; rrect(c, -150, -50, 300, 100, 24); c.fill(); c.strokeStyle = '#3b2246'; c.lineWidth = 7; c.stroke();
          text(c, '笑出鹅叫', 0, 6, { font: HZ, size: 56, align: 'center', base: 'middle', color: '#3b2246' });
          c.restore();
        }
        [[380, 260, 0], [1600, 560, 1], [470, 640, 2]].forEach(([x, y, i]) => {
          const s = bump(t, 2.7 + i * 0.15, 0.12, 0.6, 0.3) * (0.8 + 0.2 * Math.sin(t * 12 + i));
          if (s > 0) star4(c, x, y, 50 * s, '#fff');
        });
      }
      if (t >= 4.5 && t < 6.5) {
        const out = E.inB(seg(t, 6.25, 6.5));
        const s = lerp(2.6, 1, E.outQt(seg(t, 4.5, 4.65))) * (1 - out);
        // comic burst
        c.save(); c.translate(W / 2, 450); c.scale(s, s); c.rotate(Math.sin(t * 20) * 0.02);
        c.beginPath();
        for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, rr = i % 2 ? 230 : 420 + hash(i) * 80; c.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8); }
        c.closePath(); c.fillStyle = '#ffe600'; c.fill(); c.lineWidth = 12; c.strokeStyle = '#2a0a12'; c.stroke();
        c.restore();
        if (s > 0.01) hua(c, '暴击', W / 2 - 40, 430, 260, { sc: s, skew: -0.22, rot: -0.06, fill: ['#ff8a7a', '#ff2a1f', '#b80000'], stroke: '#2a0a12' });
        const n = Math.round(lerp(1, 999, E.outC(seg(t, 4.65, 5.2))));
        const ns = spring(t - 4.65, 3, 0.4) * (1 - out);
        if (ns > 0) hua(c, `×${n}`, W / 2 + 330, 620, 130, { sc: ns, rot: 0.08, fill: ['#fff9c4', '#ffd000', '#e08a00'], stroke: '#5a2300' });
        const fl = Math.exp(-(t - 4.5) * 12);
        c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(0, 0, W, H);
      }
      if (quiet) {
        const a = E.outC(seg(t, 6.6, 6.9));
        text(c, '空气突然安静', W / 2, 400, { font: HZ, size: 110, align: 'center', base: 'middle', color: `rgba(200,214,235,${a})`, stroke: `rgba(30,40,70,${a})`, lw: 14 });
        const dots = Math.floor(seg(t, 6.9, 7.8) * 3.99);
        for (let i = 0; i < dots; i++) { c.fillStyle = '#c8d6eb'; c.beginPath(); c.arc(W / 2 - 60 + i * 60, 520, 14, 0, TAU); c.fill(); }
        const cx = lerp(W + 200, -250, seg(t, 6.8, 8.15));
        crow(c, cx, 230 + Math.sin(t * 5) * 20, 1.4, t);
        if (t > 7.0 && t < 7.6) text(c, '嘎——', cx + 120, 170, { font: HZ, size: 60, color: '#e8eef8', stroke: '#1d2540', lw: 10 });
      }
      if (t >= 8.2) {
        const s = lerp(3, 1, E.outB(seg(t, 8.2, 8.42), 1.6));
        c.save(); c.translate(W / 2, 470); c.scale(s, s); c.rotate(-0.05);
        c.fillStyle = '#d71f2c';
        c.beginPath(); c.moveTo(-420, -90); c.lineTo(420, -90); c.lineTo(370, 0); c.lineTo(420, 90); c.lineTo(-420, 90); c.lineTo(-370, 0); c.closePath(); c.fill();
        c.lineWidth = 10; c.strokeStyle = '#ffd36a'; c.stroke();
        c.restore();
        hua(c, '名场面', W / 2, 462, 190, { sc: s, rot: -0.05, fill: ['#fffbe0', '#ffd34d', '#e08a00'], stroke: '#5a1200', outer: '#ffffff' });
        const tg = seg(t, 8.6, 8.75);
        text(c, '#花字  #综艺感', W / 2, 650, { font: NS, weight: 700, size: 46, align: 'center', color: `rgba(255,255,255,${tg})`, stroke: `rgba(60,20,40,${tg})`, lw: 8 });
        const cf = seg(t, 8.25, 10);
        const rr = rng(21);
        for (let k = 0; k < 60; k++) {
          const x = rr() * W, sp = 300 + rr() * 500, y = -40 + sp * cf * 1.8 - rr() * 300;
          c.save(); c.translate(x + Math.sin(cf * 10 + k) * 30, y); c.rotate(cf * 12 + k);
          c.fillStyle = ['#ffd34d', '#ff4f9a', '#4fd1ff', '#ffffff'][k % 4]; c.fillRect(-10, -5, 20, 10); c.restore();
        }
        [[560, 320], [1380, 300], [1450, 640]].forEach(([x, y], i) => { const s2 = bump(t, 8.45 + i * 0.12, 0.1, 0.3, 0.4); if (s2 > 0) star4(c, x, y, 60 * s2, '#fffbe0'); });
      }
      // subtitle line
      const subs = [[0.3, 0.9, '等一下……他刚才说什么'], [2.5, 4.5, '（全场笑翻）'], [4.5, 6.5, '这一下太真实了'], [6.5, 8.2, '……'], [8.2, 10, '本期名场面诞生']];
      subs.forEach(([a, b, s]) => { if (t >= a && t < b) text(c, s, W / 2, H - 90, { font: NS, weight: 700, size: 50, align: 'center', color: '#ffffff', stroke: 'rgba(0,0,0,0.85)', lw: 9 }); });
      vignette(c, W, H, 0.35);
    },
    score(A) {
      const pz = (t, m, g = 0.22) => A.pluck(t, midi(m), { dur: 0.35, g, bright: 0.8, decay: 0.98 });
      const prog = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
      for (let k = 0; k < 13; k++) {
        const t = k * 0.5; if (t >= 6.5) break;
        const ch = prog[Math.floor(k / 2) % 4];
        A.pluck(t, midi(ch[0] - 24), { dur: 0.3, g: 0.45, bright: 0.4, lp: 900 });
        pz(t + 0.25, ch[1]); pz(t + 0.25, ch[2], 0.15);
      }
      A.osc(0.15, { f: 400, f2: 1000, glide: 0.06, dur: 0.1, g: 0.2 });
      A.noise(0.9, { type: 'bandpass', f: 600, f2: 3000, q: 3, dur: 0.12, g: 0.25 });
      A.noise(1.02, { type: 'bandpass', f: 3000, f2: 500, q: 3, dur: 0.1, g: 0.2 });
      A.chord(0.9, [41, 48, 53, 56], { type: 'sawtooth', dur: 0.7, g: 0.07, lp: 2500, lp2: 400, lpT: 0.6, a: 0.005, spread: 10, rev: 0.3 });
      A.kick(0.9, 0.7);
      A.osc(1.1, { f: 180, f2: 90, glide: 0.4, dur: 0.5, g: 0.2, vib: [14, 30] });
      A.osc(2.5, { f: 420, f2: 1700, glide: 0.5, dur: 0.6, g: 0.1, vib: [7, 25] });
      [72, 74, 76, 79, 81].forEach((m, i) => A.osc(2.5 + i * 0.06, { f: midi(m), dur: 0.3, g: 0.14 }));
      A.bell(2.95, midi(96), { g: 0.07, dur: 0.8 });
      for (let i = 0; i < 6; i++) A.osc(3.2 + i * 0.18, { f: midi(76 + (i % 3) * 3), dur: 0.12, g: 0.06, pan: i % 2 ? 0.5 : -0.5 });
      A.impact(4.5, 1);
      A.noise(4.5, { type: 'highpass', f: 2500, dur: 0.6, g: 0.2, rev: 0.4 });
      for (let i = 0; i < 18; i++) A.osc(4.65 + 0.55 * E.outC(i / 18) * 1, { type: 'square', f: 1200 + i * 40, dur: 0.025, g: 0.05, lp: 4000 });
      A.bell(5.22, midi(98), { g: 0.09, dur: 1.2 });
      A.bell(5.3, midi(103), { g: 0.06, dur: 1.2 });
      // awkward silence: crickets and a crow
      for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) A.osc(6.75 + k * 0.24 + j * 0.035, { f: 4600, dur: 0.025, g: 0.03, pan: 0.5 });
      [7.05, 7.4].forEach(t => {
        A.osc(t, { type: 'sawtooth', f: 620, f2: 430, glide: 0.22, dur: 0.24, g: 0.07, lp: 1800, q: 6, crush: true });
      });
      A.chord(8.2, [60, 64, 67, 72], { type: 'sawtooth', dur: 1.6, g: 0.05, lp: 3200, a: 0.01, spread: 9, rev: 0.4, width: 1, hold: true, rel: 0.8 });
      A.chord(8.2, [48], { type: 'sawtooth', dur: 1.6, g: 0.08, lp: 600, hold: true, rel: 0.8 });
      A.kick(8.2, 0.9);
      A.noise(8.2, { type: 'highpass', f: 5000, dur: 1.6, g: 0.12, rev: 0.4 });
      for (let i = 0; i < 70; i++) A.noise(8.35 + hash(i * 7) * 1.4, { type: 'bandpass', f: 1500 + hash(i) * 2500, q: 1.5, dur: 0.02, g: 0.06, pan: hash(i + 3) - 0.5 });
      [84, 88, 91, 96].forEach((m, i) => A.osc(8.45 + i * 0.07, { f: midi(m), dur: 0.4, g: 0.05, rev: 0.4 }));
    },
  });

  /* ============ 10 国潮 — ink, mountains, vermilion, gold ============ */
  const GC = { paper: '#efe4cc', ink: '#1b1d20', zhu: '#c3352b', qing: '#2c5d63', dai: '#33434a', gold: '#d6aa4c' };
  const ML = [
    { base: 520, amp: 150, f: 0.0016, col: ['#b9c6be', '#e6dcc4'], par: 0.15 },
    { base: 610, amp: 170, f: 0.0022, col: ['#7f9c99', '#e2d8bf'], par: 0.3 },
    { base: 700, amp: 160, f: 0.0028, col: ['#4c7376', '#ddd2b8'], par: 0.5 },
    { base: 810, amp: 170, f: 0.0034, col: ['#2f4a50', '#d6cbb0'], par: 0.75 },
    { base: 930, amp: 130, f: 0.0042, col: ['#1d2528', '#cfc3a7'], par: 1.0 },
  ];
  function ridge(x, L, i) {
    return L.base - L.amp * (0.55 + 0.45 * vnoise(x * L.f, i * 3 + 1) + 0.25 * vnoise(x * L.f * 3.1, i * 5 + 2) + 0.08 * vnoise(x * L.f * 9, i));
  }
  function guoScene(c, t, W, H, o = {}) {
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#f2e8d2'); sky.addColorStop(1, '#e4d6b8');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    const sunY = o.sunY ?? 330;
    c.fillStyle = GC.zhu; c.beginPath(); c.arc(1320, sunY, 110, 0, TAU); c.fill();
    const pan = t * 45;
    ML.forEach((L, i) => {
      const rise = o.still ? 0 : (1 - E.outC(seg(t, 1.0 + i * 0.16, 2.5 + i * 0.16))) * 260 * (i + 1) / 5;
      const g = c.createLinearGradient(0, L.base - L.amp * 1.3, 0, L.base + 160);
      g.addColorStop(0, L.col[0]); g.addColorStop(1, L.col[1]);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-20, H + 20);
      for (let x = -20; x <= W + 20; x += 16) c.lineTo(x, ridge(x + pan * L.par + 400, L, i) + rise);
      c.lineTo(W + 20, H + 20); c.closePath(); c.fill();
      if (i < 4) {
        const mist = c.createLinearGradient(0, L.base + 40 + rise, 0, L.base + 200 + rise);
        mist.addColorStop(0, 'rgba(239,228,204,0)'); mist.addColorStop(1, 'rgba(239,228,204,0.75)');
        c.fillStyle = mist; c.fillRect(0, L.base + 40 + rise, W, 180);
      }
    });
  }
  function xiangyun(c, x, y, s, prog, col) {
    const pts = [];
    const spiral = (cx, cy, r0, turns, dir, phase) => {
      const n = 60;
      for (let k = 0; k <= n; k++) { const u = k / n, a = phase + dir * u * turns * TAU, r = r0 * (1 - u * 0.85); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    };
    for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([x - 3.2 * s + u * 2.2 * s, y + s + Math.sin(u * Math.PI * 2) * s * 0.18]); }
    spiral(x, y, s, 1.15, -1, Math.PI / 2);
    const n = Math.floor(pts.length * prog);
    c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); for (let k = 0; k < n; k++) k ? c.lineTo(pts[k][0], pts[k][1]) : c.moveTo(pts[k][0], pts[k][1]); c.stroke();
    const pts2 = [];
    for (let k = 0; k <= 50; k++) { const u = k / 50, a = -Math.PI / 2 + u * 1.1 * TAU, r = s * 0.7 * (1 - u * 0.8); pts2.push([x + 1.4 * s + Math.cos(a) * r, y - 0.2 * s + Math.sin(a) * r]); }
    const n2 = Math.floor(pts2.length * clamp(prog * 1.3 - 0.3));
    c.beginPath(); for (let k = 0; k < n2; k++) k ? c.lineTo(pts2[k][0], pts2[k][1]) : c.moveTo(pts2[k][0], pts2[k][1]); c.stroke();
  }
  function meander(x0, y0, x1, y1, u) {
    const pts = [];
    const edge = (ax, ay, bx, by, nx, ny) => {
      const len = Math.hypot(bx - ax, by - ay), n = Math.floor(len / u), dx = (bx - ax) / len, dy = (by - ay) / len;
      for (let k = 0; k < n; k++) {
        const s0 = k * u;
        [[0, 0], [0, 0.6], [0.5, 0.6], [0.5, 0]].forEach(([s, h]) => pts.push([ax + dx * (s0 + s * u) + nx * h * u, ay + dy * (s0 + s * u) + ny * h * u]));
      }
    };
    edge(x0, y0, x1, y0, 0, 1); edge(x1, y0, x1, y1, -1, 0); edge(x1, y1, x0, y1, 0, -1); edge(x0, y1, x0, y0, 1, 0);
    return pts;
  }
  MG.film({
    id: 'guochao',
    poster: 9.5,
    fonts: [['400 300px "Ma Shan Zheng"', '山河国潮'], ['600 40px "Noto Serif SC"', '丙午年秋']],
    setup() {
      const r = rng(17);
      return {
        fibers: Array.from({ length: 140 }, () => [r() * 1920, r() * 1080, r() * TAU, 20 + r() * 60]),
        border: meander(70, 70, 1850, 1010, 36),
        motes: Array.from({ length: 40 }, () => [r() * 1920, r() * 1080, 1 + r() * 2.5, r() * 6]),
      };
    },
    draw(c, t, W, H, st) {
      const paper = () => {
        c.fillStyle = GC.paper; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(120,95,60,0.08)'; c.lineWidth = 1;
        st.fibers.forEach(([x, y, a, l]) => { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); });
      };
      if (t < 5.2) {
        paper();
        if (t < 0.35) {
          const y = lerp(-60, 540, E.inQ(seg(t, 0, 0.35)));
          c.fillStyle = GC.ink; c.beginPath(); c.ellipse(960, y, 14, 22, 0, 0, TAU); c.fill();
        } else {
          const R = 1500 * E.outC(seg(t, 0.35, 1.9)) + 30;
          const shape = (rr) => {
            c.beginPath();
            for (let k = 0; k <= 160; k++) {
              const a = k / 160 * TAU, m = 1 + 0.12 * vnoise(a * 3 + 5, 1) + 0.05 * vnoise(a * 11, 2);
              const x = 960 + Math.cos(a) * rr * m, y = 540 + Math.sin(a) * rr * m * 0.92;
              k ? c.lineTo(x, y) : c.moveTo(x, y);
            }
            c.closePath();
          };
          shape(R * 1.06); c.fillStyle = 'rgba(27,29,32,0.18)'; c.fill();
          c.save();
          shape(R); c.clip();
          c.fillStyle = GC.ink; c.fillRect(0, 0, W, H);
          const rev = E.ioC(seg(t, 0.75, 1.55));
          if (rev > 0) {
            c.globalAlpha = rev;
            guoScene(c, t, W, H, { sunY: lerp(720, 330, E.outC(seg(t, 1.1, 3.4))) });
            c.globalAlpha = 1;
          }
          c.restore();
          if (R < 1400) { shape(R); c.strokeStyle = `rgba(27,29,32,${0.55 * (1 - seg(t, 1.3, 1.9))})`; c.lineWidth = 10; c.stroke(); }
        }
        if (t > 2.0) {
          [[560, 300, 70, 2.1], [1500, 520, 56, 2.6]].forEach(([x, y, s, a]) => xiangyun(c, x - (t - a) * 30, y, s, E.ioC(seg(t, a, a + 1.4)), GC.gold));
          for (let b = 0; b < 2; b++) {
            const bx = lerp(-100, 2000, seg(t, 2.2 + b * 0.3, 5.6)), by = 250 + b * 50 + Math.sin(t * 2 + b) * 10, fl = Math.sin(t * 7 + b * 2);
            c.strokeStyle = GC.ink; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath(); c.moveTo(bx - 34, by - 12 * fl); c.quadraticCurveTo(bx - 14, by - 4, bx, by); c.quadraticCurveTo(bx + 14, by - 4, bx + 34, by - 12 * fl); c.stroke();
          }
        }
      } else {
        // the vermilion scroll unrolls from the centre
        const un = E.ioC(seg(t, 5.2, 5.9));
        if (un < 1) { guoScene(c, t, W, H, { sunY: 330 }); }
        const half = (W / 2 + 40) * un;
        c.fillStyle = GC.zhu; c.fillRect(W / 2 - half, 0, half * 2, H);
        const pat = c.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1200);
        pat.addColorStop(0, 'rgba(255,190,120,0.12)'); pat.addColorStop(1, 'rgba(60,0,0,0.35)');
        c.fillStyle = pat; c.fillRect(W / 2 - half, 0, half * 2, H);
        if (un < 1) {
          [-1, 1].forEach(d => {
            const x = W / 2 + d * half;
            c.fillStyle = '#5a2a14'; c.fillRect(x - 14, -10, 28, H + 20);
            c.fillStyle = GC.gold; c.fillRect(x - 20, -10, 40, 30); c.fillRect(x - 20, H - 20, 40, 30);
          });
        }
        const bp = E.ioC(seg(t, 5.75, 6.7));
        if (bp > 0) {
          const pts = st.border, n = Math.floor(pts.length * bp);
          c.strokeStyle = GC.gold; c.lineWidth = 4; c.lineJoin = 'miter';
          c.beginPath(); for (let k = 0; k < n; k++) k ? c.lineTo(pts[k][0], pts[k][1]) : c.moveTo(pts[k][0], pts[k][1]); c.stroke();
          c.strokeStyle = 'rgba(214,170,76,0.6)'; c.lineWidth = 2;
          c.strokeRect(120, 120, (W - 240), (H - 240));
        }
        // moon gate holding the landscape
        const mr = 300 * E.outB(seg(t, 6.5, 7.05), 1.3);
        if (mr > 1) {
          c.save();
          c.beginPath(); c.arc(640, 540, mr, 0, TAU); c.clip();
          c.translate(640, 540); c.scale(0.62, 0.62); c.translate(-1150, -560);
          guoScene(c, t, W, H, { sunY: 330, still: true });
          c.restore();
          c.strokeStyle = GC.gold; c.lineWidth = 10; c.beginPath(); c.arc(640, 540, mr + 8, 0, TAU); c.stroke();
          c.lineWidth = 3; c.beginPath(); c.arc(640, 540, mr + 26, 0, TAU); c.stroke();
          if (t > 7.0) xiangyun(c, 860 - (t - 7) * 10, 820, 50, E.ioC(seg(t, 7.0, 8.2)), GC.gold);
        }
        // calligraphy revealed stroke-down, brush edge ragged
        [['山', 370, 7.35], ['河', 700, 7.85]].forEach(([ch, cy, a]) => {
          const p = E.ioC(seg(t, a, a + 0.5));
          if (p <= 0) return;
          c.save();
          c.beginPath(); c.moveTo(1050, cy - 190);
          c.lineTo(1450, cy - 190);
          for (let x = 1450; x >= 1050; x -= 20) c.lineTo(x, cy - 190 + 380 * p + vnoise(x * 0.05, a * 10) * 22);
          c.closePath(); c.clip();
          const g = c.createLinearGradient(0, cy - 160, 0, cy + 160);
          g.addColorStop(0, '#f8dc92'); g.addColorStop(0.5, '#d6aa4c'); g.addColorStop(1, '#a8762a');
          c.shadowColor = 'rgba(60,0,0,0.45)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
          text(c, ch, 1250, cy, { font: '"Ma Shan Zheng", serif', size: 330, align: 'center', base: 'middle', color: g });
          c.restore();
        });
        [...'丙午年秋'].forEach((ch, i) => { if (t >= 8.35 + i * 0.08) text(c, ch, 1530, 280 + i * 52, { font: '"Noto Serif SC", serif', weight: 600, size: 40, align: 'center', base: 'middle', color: GC.gold }); });
        if (t >= 8.8) {
          const s = lerp(1.7, 1, E.outQt(seg(t, 8.8, 8.93)));
          c.save(); c.translate(1530, 780); c.scale(s, s); c.rotate(-0.04);
          roughPoly(c, [[-80, -80], [80, -80], [80, 80], [-80, 80]], 71, 4, 16);
          c.fillStyle = '#f3e6cc'; c.fill();
          roughPoly(c, [[-66, -66], [66, -66], [66, 66], [-66, 66]], 72, 2.5, 14);
          c.strokeStyle = GC.zhu; c.lineWidth = 6; c.stroke();
          text(c, '国', 0, -30, { font: '"Ma Shan Zheng", serif', size: 70, align: 'center', base: 'middle', color: GC.zhu });
          text(c, '潮', 0, 34, { font: '"Ma Shan Zheng", serif', size: 70, align: 'center', base: 'middle', color: GC.zhu });
          const r = rng(5);
          c.fillStyle = '#f3e6cc';
          for (let k = 0; k < 40; k++) c.fillRect(-70 + r() * 140, -70 + r() * 140, 2 + r() * 4, 2 + r() * 3);
          c.restore();
        }
        c.save(); c.globalCompositeOperation = 'lighter';
        st.motes.forEach(([x, y, s, p]) => {
          const yy = (y - t * 25 + 1080) % 1080, a = 0.25 + 0.25 * Math.sin(t * 2 + p);
          c.fillStyle = `rgba(255,210,120,${a * seg(t, 6.2, 7)})`; c.beginPath(); c.arc(x + Math.sin(t + p) * 20, yy, s, 0, TAU); c.fill();
        });
        c.restore();
      }
      const shake = t >= 8.8 && t < 9.1 ? 6 * Math.exp(-(t - 8.8) * 20) : 0;
      if (shake) { c.drawImage(c.canvas, 0, 0, c.canvas.width, c.canvas.height, (hash(t) - 0.5) * shake, (hash(t + 1) - 0.5) * shake, W, H); }
      grain(c, W, H, t, 0.07, 'multiply');
      vignette(c, W, H, 0.3, '60,30,10');
    },
    score(A) {
      const pent = [62, 64, 66, 69, 71];
      const zheng = (t, m, o = {}) => A.pluck(t, midi(m), { dur: 2.4, g: 0.32, bright: 0.85, decay: 0.997, rev: 0.4, ...o });
      A.osc(0.35, { f: 1400, f2: 700, glide: 0.08, dur: 0.15, g: 0.12, rev: 0.6 });
      A.osc(0.35, { f: 75, f2: 38, glide: 0.8, dur: 1.6, g: 0.45 });
      A.noise(0.35, { type: 'lowpass', f: 400, dur: 0.6, g: 0.2 });
      for (let k = 0; k < 14; k++) zheng(0.45 + k * 0.045, pent[k % 5] + 12 * Math.floor(k / 5), { g: 0.22, dur: 1.8, pan: (k / 14 - 0.5) });
      A.osc(1.4, { f: midi(38), dur: 3.8, g: 0.09, a: 1, hold: true, rel: 0.6, type: 'triangle' });
      const mel = [[1.8, 69], [2.4, 71], [2.75, 74], [3.5, 76, 1.06], [4.2, 74], [4.6, 71]];
      mel.forEach(([t, m, b]) => zheng(t, m, b ? { bend: b, bendAt: 0.15, bendT: 0.2 } : {}));
      A.osc(2.0, { f: midi(81), dur: 2.6, g: 0.04, a: 0.4, hold: true, rel: 0.6, vib: [5, 6], rev: 0.5 });
      A.noise(2.0, { type: 'bandpass', f: 1800, q: 2, dur: 2.6, g: 0.015, a: 0.4, hold: true, rel: 0.6 });
      for (let k = 0; k < 5; k++) A.osc(1.5 + k * 0.75, { f: 900, dur: 0.06, g: 0.1, type: 'triangle', lp: 2000 });
      A.whoosh(5.2, 0.7, { f1: 300, f2: 2000, g: 0.15 });
      for (let k = 0; k < 8; k++) A.osc(5.25 + k * 0.08, { f: 700 + hash(k) * 300, dur: 0.03, g: 0.05, type: 'triangle' });
      [5.9, 6.15].forEach((t, i) => { A.osc(t, { f: 80, f2: 40, glide: 0.5, dur: 1, g: 0.5 - i * 0.15 }); A.noise(t, { type: 'lowpass', f: 600, dur: 0.3, g: 0.2 }); });
      A.bell(6.55, 110, { ratios: [1, 1.48, 2.1, 2.9], g: 0.08, dur: 3, rev: 0.6 });
      [7.35, 7.85].forEach(t => A.noise(t, { type: 'bandpass', f: 600, f2: 2500, q: 1.5, dur: 0.45, g: 0.12, swell: 0.4 }));
      zheng(7.4, 74); zheng(7.9, 78);
      A.osc(8.8, { f: 85, f2: 40, glide: 0.6, dur: 1.2, g: 0.6 });
      A.osc(8.8, { f: 1100, dur: 0.07, g: 0.12, type: 'triangle' });
      A.bell(8.85, 98, { ratios: [1, 1.52, 2.15, 2.86, 3.8], g: 0.16, dur: 3, rev: 0.7 });
      for (let k = 0; k < 14; k++) zheng(8.9 + k * 0.05, [62, 69, 74][k % 3], { g: 0.12 * (1 - k / 16), dur: 1.4 });
    },
  });
})();
