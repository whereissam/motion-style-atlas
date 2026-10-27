/* MG engine — timing, easing, drawing helpers, Web Audio instruments, player.
   Every film is a pure function of time: draw(ctx, t, W, H, state) on a 1920×1080 stage,
   so scrubbing, looping and poster frames are all the same call. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const DUR = 10;
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    lin: t => t,
    inQ: t => t * t,
    outQ: t => 1 - (1 - t) * (1 - t),
    inC: t => t * t * t,
    outC: t => 1 - Math.pow(1 - t, 3),
    ioC: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQt: t => 1 - Math.pow(1 - t, 4),
    outQn: t => 1 - Math.pow(1 - t, 5),
    inX: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outX: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    ioX: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    outB: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    inB: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    ioS: t => t * t * (3 - 2 * t),
  };
  // Damped spring from 0 to 1; t in seconds, f in Hz, z damping ratio.
  const spring = (t, f = 3, z = 0.4) => {
    if (t <= 0) return 0;
    const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  };
  // Piecewise keyframes: [[t, v], [t, v, ease], ...] — ease shapes the segment arriving at that key.
  const kf = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (t <= k[0]) {
        const p = keys[i - 1];
        return lerp(p[1], k[1], (k[2] || E.ioC)((t - p[0]) / (k[0] - p[0])));
      }
    }
    return keys[keys.length - 1][1];
  };
  const rng = seed => {
    let a = seed >>> 0 || 1;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i + seed * 57.31), hash(i + 1 + seed * 57.31), u) * 2 - 1;
  };
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- drawing helpers ---------- */
  const hasLS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  function text(ctx, s, x, y, o = {}) {
    ctx.font = `${o.style || ''} ${o.weight || 400} ${o.size || 48}px ${o.font || 'sans-serif'}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (hasLS) ctx.letterSpacing = (o.ls || 0) + 'px';
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
    if (o.color !== null) { ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y); }
    if (hasLS) ctx.letterSpacing = '0px';
  }
  function font(ctx, size, family, weight = 400, style = '') {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // Polygon with hand-cut edges: subdivides each side and jitters the points (seeded, stable over time).
  function roughPoly(ctx, pts, seed = 1, amp = 2.5, step = 26) {
    const r = rng(seed);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step));
      const nx = -(y1 - y0) / (len || 1), ny = (x1 - x0) / (len || 1);
      for (let k = 0; k < n; k++) {
        const u = k / n, j = k === 0 ? 0 : (r() - 0.5) * 2 * amp;
        const px = lerp(x0, x1, u) + nx * j, py = lerp(y0, y1, u) + ny * j;
        i === 0 && k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }
  const grainCache = [];
  function grainFrames() {
    if (grainCache.length) return grainCache;
    for (let f = 0; f < 4; f++) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d'), d = g.createImageData(256, 256), r = rng(99 + f);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = (r() * 255) | 0;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 255;
      }
      g.putImageData(d, 0, 0);
      grainCache.push(c);
    }
    return grainCache;
  }
  const patCache = new WeakMap();
  function grain(ctx, W, H, t, alpha = 0.06, mode = 'overlay') {
    let pats = patCache.get(ctx);
    if (!pats) { pats = grainFrames().map(c => ctx.createPattern(c, 'repeat')); patCache.set(ctx, pats); }
    const f = Math.floor(t * 24);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = mode;
    ctx.translate(-((hash(f) * 256) | 0), -((hash(f + 7) * 256) | 0));
    ctx.fillStyle = pats[f % 4];
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
  }
  function vignette(ctx, W, H, strength = 0.55, color = '0,0,0') {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, `rgba(${color},0)`);
    g.addColorStop(1, `rgba(${color},${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  function offscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /* ---------- audio ---------- */
  const Audio = {
    ac: null,
    get() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.build(new AC());
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      return this.ac;
    },
    build(ac, dest = ac.destination) {
      this.ac = ac;
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4;
        comp.attack.value = 0.004; comp.release.value = 0.18;
        const out = ac.createGain(); out.gain.value = 0.85;
        comp.connect(out).connect(dest);
        this.comp = comp;
        // shared reverb: stereo exponentially decaying noise
        const len = Math.round(ac.sampleRate * 2.8), ir = ac.createBuffer(2, len, ac.sampleRate), r = rng(7);
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch);
          for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2);
        }
        this.verb = ac.createConvolver(); this.verb.buffer = ir;
        const vg = ac.createGain(); vg.gain.value = 0.55;
        this.verb.connect(vg).connect(comp);
        const nl = ac.sampleRate * 2, nb = ac.createBuffer(1, nl, ac.sampleRate), nd = nb.getChannelData(0);
        for (let i = 0; i < nl; i++) nd[i] = r() * 2 - 1;
        this.noiseBuf = nb;
        const curve = new Float32Array(1024);
        for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.round(x * 6) / 6; }
        this.crushCurve = curve;
        this.ks = new Map();
      return ac;
    },
    // Karplus–Strong plucked string rendered to a buffer (cached).
    ksBuf(f, dur, bright, decay) {
      const key = `${f.toFixed(2)}|${dur}|${bright}|${decay}`;
      if (this.ks.has(key)) return this.ks.get(key);
      const ac = this.ac, sr = ac.sampleRate, len = Math.round(sr * dur), N = Math.max(2, Math.round(sr / f));
      const b = ac.createBuffer(1, len, sr), y = b.getChannelData(0), r = rng(Math.round(f * 13));
      let prev = 0;
      for (let i = 0; i < N && i < len; i++) { const w = r() * 2 - 1; prev = lerp(prev, w, bright); y[i] = prev; }
      for (let i = N; i < len; i++) y[i] = decay * 0.5 * (y[i - N] + y[i - N - 1 < 0 ? 0 : i - N - 1]);
      this.ks.set(key, b);
      return b;
    },
  };

  // Score API handed to each film's score(A). Times are film seconds; events before t0 are skipped.
  class Score {
    constructor(ac, t0) {
      this.ac = ac; this.t0 = t0;
      this.base = ac.currentTime + 0.06;
      this.bus = ac.createGain(); this.bus.connect(Audio.comp);
      this.send = ac.createGain(); this.send.gain.value = 1; this.send.connect(Audio.verb);
    }
    T(t) { return t < this.t0 - 0.005 ? null : this.base + (t - this.t0); }
    stop() {
      const now = this.ac.currentTime;
      [this.bus, this.send].forEach(g => {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + 0.06);
        setTimeout(() => g.disconnect(), 200);
      });
    }
    _out(node, w, o) {
      let n = node;
      if (o.pan) { const p = this.ac.createStereoPanner ? this.ac.createStereoPanner() : null; if (p) { p.pan.value = o.pan; n.connect(p); n = p; } }
      n.connect(this.bus);
      if (o.rev) { const s = this.ac.createGain(); s.gain.value = o.rev; n.connect(s).connect(this.send); }
    }
    _env(g, w, a, dur, peak, curve = 'exp', rel = 0.02) {
      g.gain.setValueAtTime(0.0001, w);
      g.gain.linearRampToValueAtTime(peak, w + a);
      if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, w + Math.max(a + 0.01, dur));
      else { g.gain.setValueAtTime(peak, w + Math.max(a, dur - rel)); g.gain.linearRampToValueAtTime(0.0001, w + dur); }
    }
    osc(t, o = {}) {
      const w = this.T(t); if (w === null) return;
      const ac = this.ac, dur = o.dur ?? 0.3;
      const os = ac.createOscillator(); os.type = o.type || 'sine';
      os.frequency.setValueAtTime(o.f ?? 440, w);
      if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, w + (o.glide ?? dur));
      if (o.detune) os.detune.value = o.detune;
      if (o.vib) {
        const l = ac.createOscillator(), lg = ac.createGain();
        l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
        l.connect(lg).connect(os.frequency); l.start(w); l.stop(w + dur + 0.05);
      }
      let n = os;
      if (o.lp) {
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = o.q ?? 1;
        f.frequency.setValueAtTime(o.lp, w);
        if (o.lp2) f.frequency.exponentialRampToValueAtTime(o.lp2, w + (o.lpT ?? dur));
        n.connect(f); n = f;
      }
      if (o.crush) { const s = ac.createWaveShaper(); s.curve = Audio.crushCurve; n.connect(s); n = s; }
      const g = ac.createGain();
      this._env(g, w, o.a ?? 0.005, dur, o.g ?? 0.3, o.hold ? 'lin' : 'exp', o.rel);
      n.connect(g);
      this._out(g, w, o);
      os.start(w); os.stop(w + dur + 0.05);
    }
    noise(t, o = {}) {
      const w = this.T(t); if (w === null) return;
      const ac = this.ac, dur = o.dur ?? 0.2;
      const src = ac.createBufferSource(); src.buffer = Audio.noiseBuf; src.loop = true;
      if (o.rate) src.playbackRate.value = o.rate;
      const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q ?? 1;
      f.frequency.setValueAtTime(o.f ?? 2000, w);
      if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, w + (o.sweep ?? dur));
      let n = src; n.connect(f); n = f;
      if (o.crush) { const s = ac.createWaveShaper(); s.curve = Audio.crushCurve; n.connect(s); n = s; }
      const g = ac.createGain();
      if (o.swell) { g.gain.setValueAtTime(0.0001, w); g.gain.exponentialRampToValueAtTime(o.g ?? 0.3, w + dur * o.swell); g.gain.exponentialRampToValueAtTime(0.0001, w + dur); }
      else this._env(g, w, o.a ?? 0.002, dur, o.g ?? 0.3, o.hold ? 'lin' : 'exp', o.rel);
      n.connect(g);
      this._out(g, w, o);
      // distinct offset per call so simultaneous noise hits do not sum coherently
      this._nz = (this._nz || 0) + 1;
      src.start(w, hash(t * 31 + this._nz * 7.13) * 1.5); src.stop(w + dur + 0.05);
    }
    kick(t, g = 0.9, o = {}) {
      this.osc(t, { f: o.f || 150, f2: o.f2 || 42, glide: o.glide || 0.12, dur: o.dur || 0.42, g, a: 0.002 });
      this.noise(t, { type: 'highpass', f: 3000, dur: 0.012, g: g * 0.25 });
    }
    snare(t, g = 0.5, o = {}) {
      this.noise(t, { type: 'bandpass', f: o.f || 1900, q: 0.7, dur: o.dur || 0.2, g, rev: o.rev ?? 0.15, hold: o.gated });
      this.osc(t, { f: 210, f2: 150, dur: 0.1, g: g * 0.5, type: 'triangle' });
    }
    clap(t, g = 0.4, o = {}) {
      [0, 0.011, 0.023].forEach(d => this.noise(t + d, { type: 'bandpass', f: 1300, q: 1.2, dur: 0.02, g }));
      this.noise(t + 0.03, { type: 'bandpass', f: 1200, q: 1, dur: 0.18, g: g * 0.8, rev: o.rev ?? 0.25 });
    }
    hat(t, g = 0.12, open = false, o = {}) {
      this.noise(t, { type: 'highpass', f: o.f || 8000, dur: open ? 0.22 : 0.04, g, pan: o.pan || 0 });
    }
    pluck(t, f, o = {}) {
      const w = this.T(t); if (w === null) return;
      const ac = this.ac, dur = o.dur ?? 1.6;
      const src = ac.createBufferSource(); src.buffer = Audio.ksBuf(f, dur, o.bright ?? 0.7, o.decay ?? 0.996);
      if (o.bend) { src.playbackRate.setValueAtTime(1, w + (o.bendAt ?? 0)); src.playbackRate.exponentialRampToValueAtTime(o.bend, w + (o.bendAt ?? 0) + (o.bendT ?? 0.15)); }
      const g = ac.createGain(); g.gain.value = o.g ?? 0.5;
      let n = src;
      if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; n.connect(fl); n = fl; }
      n.connect(g);
      this._out(g, w, o);
      src.start(w); src.stop(w + dur);
    }
    bell(t, f, o = {}) {
      const ratios = o.ratios || [1, 2.76, 5.4, 8.93], g = o.g ?? 0.18, dur = o.dur ?? 2.4;
      ratios.forEach((r, i) => this.osc(t, { f: f * r, dur: dur / (1 + i * 0.7), g: g / (1 + i * 1.4), a: 0.002, rev: o.rev ?? 0.4, pan: o.pan || 0 }));
    }
    whoosh(t, dur = 0.5, o = {}) {
      this.noise(t, { type: 'bandpass', f: o.f1 || 300, f2: o.f2 || 3500, q: o.q ?? 1.4, dur, g: o.g ?? 0.25, swell: o.swell ?? 0.6, rev: o.rev ?? 0.2, pan: o.pan || 0 });
    }
    riser(t, dur = 2, o = {}) {
      this.noise(t, { type: 'bandpass', f: 400, f2: 6000, q: 2, dur, g: o.g ?? 0.2, swell: 0.95, rev: 0.3 });
      this.osc(t, { type: 'sawtooth', f: o.f || 110, f2: (o.f || 110) * 4, glide: dur, dur, g: (o.g ?? 0.2) * 0.35, lp: 800, lp2: 6000, lpT: dur, a: dur * 0.9 });
    }
    impact(t, g = 0.9, o = {}) {
      this.osc(t, { f: 90, f2: 30, glide: 0.6, dur: 1.4, g, a: 0.002 });
      this.noise(t, { type: 'lowpass', f: 4000, f2: 200, dur: 0.9, g: g * 0.5, rev: o.rev ?? 0.5 });
    }
    chord(t, notes, o = {}) {
      notes.forEach((m, i) => {
        const f = midi(m);
        this.osc(t, { ...o, f, detune: (o.spread || 0) * (i % 2 ? 1 : -1), pan: o.width ? ((i / (notes.length - 1 || 1)) - 0.5) * o.width : 0 });
        if (o.spread) this.osc(t, { ...o, f, detune: -(o.spread || 0) * (i % 2 ? 1 : -1), g: (o.g ?? 0.3) * 0.7 });
      });
    }
  }

  /* ---------- player ---------- */
  const films = {};
  const players = [];
  let soundOn = true;
  let fontsReady = Promise.resolve();

  function fmt(t) {
    const s = Math.floor(t), f = Math.floor((t - s) * 24);
    return `00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  }

  class Player {
    constructor(root) {
      this.root = root;
      this.film = films[root.dataset.film];
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.t = this.film.poster ?? 9;
      this.playing = false;
      this.loop = false;
      this.state = this.film.setup ? this.film.setup() : {};
      this.ui = {
        big: root.querySelector('.big-play'),
        play: root.querySelector('[data-act="play"]'),
        time: root.querySelector('.tc'),
        scrub: root.querySelector('input[type="range"]'),
        loop: root.querySelector('[data-act="loop"]'),
        full: root.querySelector('[data-act="full"]'),
        cues: [...root.parentElement.querySelectorAll('.cues li')],
        head: root.parentElement.querySelector('.cue-head'),
      };
      this.ui.big.addEventListener('click', () => this.play(0));
      this.ui.play.addEventListener('click', () => (this.playing ? this.pause() : this.play(this.t >= DUR - 0.01 ? 0 : this.t)));
      this.ui.loop.addEventListener('click', () => {
        this.loop = !this.loop;
        this.ui.loop.setAttribute('aria-pressed', String(this.loop));
      });
      this.ui.full.addEventListener('click', () => {
        const el = this.root;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
      });
      this.ui.scrub.addEventListener('input', () => {
        const wasPlaying = this.playing;
        if (wasPlaying) this.pause(true);
        this.t = (this.ui.scrub.value / 1000) * DUR;
        this.render();
        if (wasPlaying) this.play(this.t);
      });
      this.ui.cues.forEach(li => {
        li.addEventListener('click', () => {
          const t = parseFloat(li.dataset.t);
          this.playing ? this.play(t) : (this.t = t, this.render());
        });
      });
      this.canvas.addEventListener('click', () => (this.playing ? this.pause() : this.play(this.t >= DUR - 0.01 ? 0 : this.t)));
      new ResizeObserver(() => this.resize()).observe(this.canvas);
    }
    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.min(1920, Math.round(r.width * dpr));
      if (this.canvas.width !== w) {
        this.canvas.width = w;
        this.canvas.height = Math.round((w * 9) / 16);
      }
      this.scale = w / 1920;
      this.render();
    }
    render() {
      const c = this.ctx;
      c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      c.save();
      try { this.film.draw(c, Math.min(this.t, DUR - 1e-4), 1920, 1080, this.state); }
      catch (e) { console.error(this.film.id, e); }
      c.restore();
      this.ui.time.textContent = fmt(Math.min(this.t, DUR));
      this.ui.scrub.value = String(Math.round((this.t / DUR) * 1000));
      const p = Math.min(this.t / DUR, 1);
      if (this.ui.head) this.ui.head.style.setProperty('--p', p);
      let active = -1;
      this.ui.cues.forEach((li, i) => { if (parseFloat(li.dataset.t) <= this.t + 1e-3) active = i; });
      this.ui.cues.forEach((li, i) => li.classList.toggle('on', i === active && (this.playing || this.t > 0)));
    }
    play(from = 0) {
      players.forEach(p => p !== this && p.playing && p.pause());
      this.pause(true);
      this.t = from;
      this.playing = true;
      this.root.classList.add('is-playing');
      this.ui.play.setAttribute('aria-label', '暂停');
      if (soundOn && this.film.score) {
        const ac = Audio.get();
        if (ac) {
          this.score = new Score(ac, from);
          try { this.film.score(this.score); } catch (e) { console.error(this.film.id, 'score', e); }
        }
      }
      const startWall = performance.now();
      const startAudio = this.score ? this.score.base : null;
      const tick = () => {
        if (!this.playing) return;
        // follow the audio clock when sound is running so picture and sound stay locked
        let t = startAudio !== null ? from + (Audio.ac.currentTime - startAudio) : from + (performance.now() - startWall) / 1000;
        t = Math.max(from, t);
        if (t >= DUR) {
          if (this.loop) { this.play(0); return; }
          this.t = DUR; this.pause(); this.render(); return;
        }
        this.t = t;
        this.render();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    pause(silent) {
      cancelAnimationFrame(this.raf);
      if (this.score) { this.score.stop(); this.score = null; }
      if (!this.playing && silent) return;
      this.playing = false;
      this.root.classList.remove('is-playing');
      this.ui.play.setAttribute('aria-label', '播放');
    }
  }

  function boot() {
    // fonts entries are a CSS font spec, or [spec, glyphs] so CJK unicode-range slices load before drawing
    const loads = [];
    Object.values(films).forEach(f => (f.fonts || []).forEach(x => {
      const [spec, glyphs] = Array.isArray(x) ? x : [x, 'Aa1'];
      if (document.fonts) loads.push(document.fonts.load(spec, glyphs).catch(() => {}));
    }));
    fontsReady = Promise.race([Promise.all(loads), new Promise(r => setTimeout(r, 4000))]);
    if (document.fonts) document.fonts.addEventListener?.('loadingdone', () => players.forEach(p => !p.playing && p.render()));
    fontsReady.then(() => {
      document.querySelectorAll('.stage[data-film]').forEach(el => {
        if (!films[el.dataset.film]) return;
        const p = new Player(el);
        players.push(p);
        p.resize();
      });
      const io = new IntersectionObserver(es => es.forEach(e => {
        const p = players.find(x => x.root === e.target);
        if (p && !e.isIntersecting && p.playing) p.pause();
      }), { threshold: 0.15 });
      players.forEach(p => io.observe(p.root));
      document.addEventListener('visibilitychange', () => document.hidden && players.forEach(p => p.playing && p.pause()));
    });
    const snd = document.getElementById('sound-toggle');
    if (snd) snd.addEventListener('click', () => {
      soundOn = !soundOn;
      snd.setAttribute('aria-pressed', String(soundOn));
      snd.querySelector('span').textContent = soundOn ? '声音 开' : '声音 关';
      players.forEach(p => p.playing && p.play(p.t));
    });
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' || /input|button|textarea/i.test(document.activeElement?.tagName || '')) return;
      const vis = players.find(p => p.playing) || players.find(p => { const r = p.root.getBoundingClientRect(); return r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4; });
      if (!vis) return;
      e.preventDefault();
      vis.playing ? vis.pause() : vis.play(vis.t >= DUR - 0.01 ? 0 : vis.t);
    });
  }

  window.MG = {
    TAU, DUR, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi,
    text, font, rrect, roughPoly, grain, vignette, offscreen,
    film(def) { films[def.id] = def; },
    // Load a Google Fonts stylesheet from a film file; render/export waits on these.
    _fontLinks: [],
    useFonts(href) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      this._fontLinks.push(new Promise(r => { l.onload = r; l.onerror = r; }));
      document.head.appendChild(l);
    },
    films,
    boot,
    // Offline export: draw one frame of a film into a 1920×1080 canvas.
    frame(id, t, canvas) {
      const f = films[id];
      if (!f._st) f._st = f.setup ? f.setup() : {};
      const ctx = canvas.getContext('2d');
      ctx.setTransform(canvas.width / 1920, 0, 0, canvas.width / 1920, 0, 0);
      ctx.save();
      f.draw(ctx, Math.min(t, (f.dur || DUR) - 1e-4), 1920, 1080, f._st);
      ctx.restore();
    },
    // Offline export: render a film's score to 16-bit stereo WAV bytes.
    async audio(id, sr = 48000) {
      const prev = { ...Audio };
      const D = films[id].dur || DUR;
      const off = new OfflineAudioContext(2, Math.round(sr * (D + 0.5)), sr);
      Audio.build(off);
      const sc = new Score(off, 0);
      sc.base = 0;
      films[id].score(sc);
      const buf = await off.startRendering();
      Object.assign(Audio, prev);
      const n = Math.round(sr * D), L = buf.getChannelData(0), R = buf.getChannelData(1);
      const out = new DataView(new ArrayBuffer(44 + n * 4));
      const w = (o, s) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
      w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt ');
      out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
      out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true);
      w(36, 'data'); out.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) {
        const fade = Math.min(1, (n - i) / (sr * 0.05));
        out.setInt16(44 + i * 4, clamp(L[i] * fade, -1, 1) * 32767, true);
        out.setInt16(46 + i * 4, clamp(R[i] * fade, -1, 1) * 32767, true);
      }
      return new Uint8Array(out.buffer);
    },
  };
})();
