# Harmonograph

*Damped pendulum drawings · 1844 — · Experimental & Generative*

Reference film: `videos/harmonograph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Harmonograph** (Damped pendulum drawings, 1844 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The harmonograph is a Victorian drawing machine: two or three pendulums, coupled to a pen and a drawing table, trace damped Lissajous figures that spiral slowly to the centre as the swings die away. Hugh Blackburn's pendulum of 1844 and Jules Lissajous's optical figures of 1857 led to parlour and lecture-hall instruments, and in 1909 Joseph Goold and his co-authors published Harmonic Vibrations and Vibration Figures, an album of rosettes drawn by twin-elliptic pendulums tuned to musical intervals. It is an ancestor of plotter and generative art: a simple physical rule, run for long enough, makes intricate drawings.
- Study these reference works: Hugh Blackburn — Blackburn pendulum (1844) · Jules Antoine Lissajous — vibration figures (1857) · Joseph Goold, Charles E. Benham, Richard Kerr & L. R. Wilberforce — Harmonic Vibrations and Vibration Figures (1909)
- Motion DNA: Two pendulums released from rest swing in slow ellipses; the pen loops in real time, then time-lapses into a blur while a rosette builds layer on layer, rotates by its slight mistuning and shrinks inward as damping takes the energy out.
- Visual DNA: Walnut and brass machinery in warm lamplight, a cream card with fine indigo ink lines that darken where they overlap, and a Victorian plate caption in Fell type.
- Signature transitions: Draw back and release, pen drop, real time to time-lapse, pen lift, machine slides out, card becomes the plate
- Key techniques: Damped sinusoids, Analytic time-lapse, Ink on card

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Damped sinusoids, Analytic time-lapse, Ink on card).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Damped sinusoids and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HARMONOGRAPH", held for about 1 s.

BUILD RULES
- Suggested tools: Physical harmonograph, Processing / p5.js, Pen plotter (AxiDraw), Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Harmonograph motion-graphics film (Damped pendulum drawings). Visual style: walnut and brass machinery in warm lamplight, a cream card with fine indigo ink lines that darken where they overlap, and a Victorian plate caption in Fell type. Motion: two pendulums released from rest swing in slow ellipses; the pen loops in real time, then time-lapses into a blur while a rosette builds layer on layer, rotates by its slight mistuning and shrinks inward as damping takes the energy out. Signature moves: damped sinusoids, analytic time-lapse, ink on card; transitions: draw back and release, pen drop, real time to time-lapse, pen lift, machine slides out, card becomes the plate. In the tradition of Hugh Blackburn — Blackburn pendulum (1844) · Jules Antoine Lissajous — vibration figures (1857) · Joseph Goold, Charles E. Benham, Richard Kerr & L. R. Wilberforce — Harmonic Vibrations and Vibration Figures (1909). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HARMONOGRAPH". Punchy sound design synced to every cut.
```
