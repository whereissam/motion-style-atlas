/* Narrative Formats kit — the shared cast, structure strip and caption for family M.
   Every format film stars the same cast — the Token and the word MOTION from the Technique Atlas
   kit (MG.TK) — so the only thing that changes from film to film is the format: how a title
   sequence, a trailer, a ten-second ad or a tutorial arranges ten seconds.

   The structure strip along the top of the frame is the family's signature: the format's beats
   (hook, acts, the turn, the call to action…) laid out as named segments on the 10 s timeline,
   with a playhead, so each film shows its structure while it plays it. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, text } = MG;
  const TK = MG.TK, P = TK.P;

  /* Beats: [{ t0, t1, name, kind? }] in seconds. kind: 'hook' | 'act' | 'turn' | 'cta' | 'title' |
     'break' — each kind has its own mark colour, so structures read at a glance across films. */
  const KIND = { hook: P.accent, act: '#8f8a80', turn: P.blue, cta: '#17181c', title: '#c63e0c', break: 'rgba(143,138,128,0.45)' };

  /* The structure strip. o: y (top, default 26), x0/x1 (default 72 / W − 72), dark (light ink on
     dark frames), alpha, label (format name, small, left of the strip). The current beat is
     filled, past beats are solid, future beats outlined; the playhead is the orange dot. */
  function strip(c, t, W, H, beats, o = {}) {
    const y = o.y ?? 26, x0 = o.x0 ?? 72, x1 = o.x1 ?? W - 72, h = 10, X = s => lerp(x0, x1, s / 10);
    const ink = o.dark ? 'rgba(236,232,223,0.9)' : P.ink, mute = o.dark ? 'rgba(236,232,223,0.55)' : P.mute;
    c.save(); c.globalAlpha *= o.alpha ?? 1;
    if (o.label) text(c, o.label.toUpperCase(), x0, y - 4, { font: TK.MONO, size: 13, ls: 3, color: mute, base: 'bottom' });
    beats.forEach((b, i) => {
      const a = X(b.t0) + 1.5, z = X(b.t1) - 1.5, col = KIND[b.kind || 'act'] || KIND.act;
      const cur = t >= b.t0 && t < b.t1, past = t >= b.t1;
      c.lineWidth = 1.5; c.strokeStyle = col; c.strokeRect(a, y + 0.5, z - a, h);
      if (past || cur) {
        c.fillStyle = col; c.globalAlpha = (o.alpha ?? 1) * (cur ? 1 : 0.55);
        c.fillRect(a, y + 0.5, cur ? (z - a) * clamp((t - b.t0) / (b.t1 - b.t0)) : z - a, h);
        c.globalAlpha = o.alpha ?? 1;
      }
      const w = z - a;
      if (w > 40) text(c, b.name.toUpperCase(), a + 2, y + h + 18, { font: TK.MONO, size: 12, ls: 2, color: cur ? ink : mute, weight: cur ? 700 : 400 });
      else if (cur) text(c, b.name.toUpperCase(), a + 2, y + h + 18, { font: TK.MONO, size: 12, ls: 2, color: ink, weight: 700 });
    });
    const px = X(clamp(t, 0, 10));
    c.fillStyle = P.accent; c.beginPath(); c.arc(px, y + h / 2 + 0.5, 6, 0, TAU); c.fill();
    c.fillStyle = o.dark ? '#17181c' : P.ground; c.beginPath(); c.arc(px, y + h / 2 + 0.5, 2.5, 0, TAU); c.fill();
    c.restore();
  }
  /* The beat active at t (or null). */
  const beatAt = (beats, t) => beats.find(b => t >= b.t0 && t < b.t1) || null;

  /* Caption: the Technique Atlas caption layout with the NARRATIVE FORMATS series label. */
  function caption(c, t, W, H, o) {
    if (o.dark) {
      c.save();
      const gr = c.createLinearGradient(0, H - 260, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = gr; c.fillRect(0, H - 260, W, 260); c.restore();
    }
    TK.caption(c, t, W, H, { ...o, series: 'NARRATIVE FORMATS' });
  }

  /* Letterbox bars for an aspect ratio (e.g. 2.39). amt 0..1 animates them in. Returns the
     picture rect [x, y, w, h]. */
  function letterbox(c, W, H, ratio = 2.39, amt = 1, color = '#0b0b0c') {
    const ph = W / ratio, bar = (H - ph) / 2 * clamp(amt);
    c.fillStyle = color; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    return [0, bar, W, H - bar * 2];
  }

  /* Title-safe / action-safe guides (90 % and 80 %), as broadcast formats use. */
  function safeFrame(c, W, H, o = {}) {
    c.save(); c.globalAlpha *= o.alpha ?? 0.5; c.setLineDash([6, 8]); c.lineWidth = 1.5;
    c.strokeStyle = o.dark ? 'rgba(236,232,223,0.6)' : 'rgba(23,24,28,0.45)';
    [[0.9, 'ACTION SAFE'], [0.8, 'TITLE SAFE']].forEach(([k, n]) => {
      const w = W * k, h = H * k, x = (W - w) / 2, y = (H - h) / 2;
      c.strokeRect(x, y, w, h);
      if (o.labels) text(c, n, x + 8, y + 18, { font: TK.MONO, size: 12, ls: 2, color: c.strokeStyle });
    });
    c.restore();
  }

  /* A vertical 9:16 phone frame centred at cx with height h; returns the screen rect for clipping. */
  function phone(c, cx, cy, h, o = {}) {
    const w = h * 9 / 16, x = cx - w / 2, y = cy - h / 2, r = h * 0.05;
    c.save();
    c.fillStyle = o.body || '#17181c'; MG.rrect(c, x - 14, y - 14, w + 28, h + 28, r + 12); c.fill();
    c.restore();
    return [x, y, w, h, r];
  }

  /* Small mono label (same as the other kits). */
  function label(c, s, x, y, o = {}) {
    text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  }

  MG.FK = { KIND, strip, beatAt, caption, letterbox, safeFrame, phone, label, fonts: TK.fonts };
})();
