# Strange Attractors

*Lorenz · Clifford · De Jong · 1963 — · Experimental & Generative*

Reference film: `videos/attractor.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Strange Attractors** (Lorenz · Clifford · De Jong, 1963 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Edward Lorenz's 1963 paper "Deterministic Nonperiodic Flow" found the butterfly-shaped attractor in a three-equation weather model; Peter de Jong's and Clifford Pickover's 2D maps, popularised by Paul Bourke and A. K. Dewdney, turned iterated chaos into density images.
- Study these reference works: E. N. Lorenz, Deterministic Nonperiodic Flow (1963) · Clifford A. Pickover, Chaos in Wonderland (1994) · A. K. Dewdney, Computer Recreations, Scientific American (1987) · Paul Bourke, Strange Attractors gallery · Jos Leys, Étienne Ghys & Aurélien Alvarez, Chaos: A Mathematical Adventure (2013)
- Motion DNA: A single orbit never repeats: one bright point traces the flow, the camera orbits as millions of samples accumulate, and the parameters drift so the whole cloud morphs between attractors.
- Visual DNA: Filaments of light on black built from log-tone-mapped point density, chromatic wings in magenta and cyan, fine mono equations and live parameter readouts.
- Signature transitions: Lone-trail reveal, 3D-to-2D particle morph, parameter sweep, attractor crossfade, hero settle
- Key techniques: RK4 ODE integration, Million-point density buffers, Index-matched attractor morphs

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (RK4 ODE integration, Million-point density buffers, Index-matched attractor morphs).
- 5.0–8.0 s  Climax: the most spectacular moment, built on RK4 ODE integration and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "STRANGE ATTRACTORS", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL, TouchDesigner, Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Strange Attractors motion-graphics film (Lorenz · Clifford · De Jong). Visual style: filaments of light on black built from log-tone-mapped point density, chromatic wings in magenta and cyan, fine mono equations and live parameter readouts. Motion: a single orbit never repeats: one bright point traces the flow, the camera orbits as millions of samples accumulate, and the parameters drift so the whole cloud morphs between attractors. Signature moves: rk4 ode integration, million-point density buffers, index-matched attractor morphs; transitions: lone-trail reveal, 3D-to-2D particle morph, parameter sweep, attractor crossfade, hero settle. In the tradition of E. N. Lorenz, Deterministic Nonperiodic Flow (1963) · Clifford A. Pickover, Chaos in Wonderland (1994) · A. K. Dewdney, Computer Recreations, Scientific American (1987) · Paul Bourke, Strange Attractors gallery · Jos Leys, Étienne Ghys & Aurélien Alvarez, Chaos: A Mathematical Adventure (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "STRANGE ATTRACTORS". Punchy sound design synced to every cut.
```
