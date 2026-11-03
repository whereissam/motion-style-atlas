# Noise

*Smooth random, octave by octave · 1983 — · Technique Atlas*

Reference film: `videos/technoise.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Noise** (Smooth random, octave by octave, 1983 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Ken Perlin invented gradient noise while working on the computer imagery for Tron (1982) and published it as An Image Synthesizer (SIGGRAPH 1985); it earned him a Technical Achievement Academy Award in 1997, and he refined it as Improved Noise (2002). Summing octaves of noise at doubling frequency and halving amplitude — fractal Brownian motion, after Mandelbrot and Van Ness — became the standard way to drive organic motion, from camera shake to the Wiggle expression in After Effects.
- Study these reference works: Tron (Disney, 1982) · An Image Synthesizer (Ken Perlin, SIGGRAPH 1985) · After Effects wiggle() expression (Adobe)
- Motion DNA: Two seconds of white random jitter — a new value every frame, so the Token strobes and its trail scribbles. Then it glides on one slow octave of noise; on each bar a further octave arrives at twice the frequency and half the amplitude, adding tremble on top of drift. Finally a grid of Tokens turns, swells and lifts together as one noise field scrolls through them, neighbours in step, distant ones out of phase.
- Visual DNA: The Technique Atlas stage; the orange Token with a fading trail of ghosts and its centre path; a scrolling signal graph along the top; on the left a stack of four octave plots, each lighting up as it enters; for the field, a faint warm-and-blue noise map behind an 11 × 5 grid of Tokens, three of them ringed in ink, blue and dark orange to match their curves.
- Signature transitions: Cut from random to coherent on the beat; octaves fade in on each bar; the hero Token shrinks into the centre of the field
- Key techniques: 1D Perlin gradient noise, fBm: octaves at 2× frequency, ½ amplitude, Per-instance offsets into a 2D noise field

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (1D Perlin gradient noise, fBm: octaves at 2× frequency, ½ amplitude, Per-instance offsets into a 2D noise field).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 1D Perlin gradient noise and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NOISE", held for about 1 s.

BUILD RULES
- Suggested tools: Seeded permutation and gradient tables, fBm sum with per-octave weights faded in, Canvas 2D: per-frame low-res noise map scaled up, trails resampled from t. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Noise motion-graphics film (Smooth random, octave by octave). Visual style: the Technique Atlas stage; the orange Token with a fading trail of ghosts and its centre path; a scrolling signal graph along the top; on the left a stack of four octave plots, each lighting up as it enters; for the field, a faint warm-and-blue noise map behind an 11 × 5 grid of Tokens, three of them ringed in ink, blue and dark orange to match their curves. Motion: two seconds of white random jitter — a new value every frame, so the Token strobes and its trail scribbles. Then it glides on one slow octave of noise; on each bar a further octave arrives at twice the frequency and half the amplitude, adding tremble on top of drift. Finally a grid of Tokens turns, swells and lifts together as one noise field scrolls through them, neighbours in step, distant ones out of phase. Signature moves: 1d perlin gradient noise, fbm: octaves at 2× frequency, ½ amplitude, per-instance offsets into a 2d noise field; transitions: cut from random to coherent on the beat; octaves fade in on each bar; the hero Token shrinks into the centre of the field. In the tradition of Tron (Disney, 1982) · An Image Synthesizer (Ken Perlin, SIGGRAPH 1985) · After Effects wiggle() expression (Adobe). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NOISE". Punchy sound design synced to every cut.
```
