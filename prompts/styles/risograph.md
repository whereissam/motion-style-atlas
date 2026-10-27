# Risograph Animation

*Stencil-Duplicator Print Look · 1986 — · revival 2010s — · Graphic Design & Historical*

Reference film: `videos/risograph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Risograph Animation** (Stencil-Duplicator Print Look, 1986 — · revival 2010s —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Riso Kagaku of Tokyo released its first Risograph digital duplicator in 1986: a thermal master stencil is burned and wrapped on an ink drum, and each colour is a separate pass of soy-based ink. Built for schools and offices, the machines were adopted by zine makers and art-book presses in the 2010s, and riso-printed flipbooks and frame-by-frame print animations, often faked digitally, turned its grain, fluorescent pink and loose registration into a motion look.
- Study these reference works: RISOGRAPH 007 (Riso Kagaku, 1986) · Print Gocco (Riso Kagaku, 1977) · Nieves zines (Zurich, Benjamin Sommerhalder) · Hato Press (London) · Colorama (Berlin) · Risotto Studio (Glasgow)
- Motion DNA: Animated on twos, and every drawing is a separate pull: the plates shift a few pixels and the grain changes each frame, so even a still image boils; colour arrives one drum pass at a time.
- Visual DNA: Cream uncoated paper, fluorescent pink, yellow and blue soy inks overprinting into orange, purple and green, grainy uneven solids, coarse halftone gradients, white knockouts and registration marks.
- Signature transitions: Drum pass wipe, overprint build-up, misregistration storm, paper jam smear, sheet eject and feed
- Key techniques: One offscreen plate per ink, multiplied, Per-frame misregistration, Stochastic ink coverage mask, Rotated halftone screens

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One offscreen plate per ink, multiplied, Per-frame misregistration, Stochastic ink coverage mask, Rotated halftone screens).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One offscreen plate per ink, multiplied and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RISOGRAPH ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Photoshop / Procreate riso brushes, Real Risograph print-and-scan, Canvas 2D (multiply compositing). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Risograph Animation motion-graphics film (Stencil-Duplicator Print Look). Visual style: cream uncoated paper, fluorescent pink, yellow and blue soy inks overprinting into orange, purple and green, grainy uneven solids, coarse halftone gradients, white knockouts and registration marks. Motion: animated on twos, and every drawing is a separate pull: the plates shift a few pixels and the grain changes each frame, so even a still image boils; colour arrives one drum pass at a time. Signature moves: one offscreen plate per ink, multiplied, per-frame misregistration, stochastic ink coverage mask, rotated halftone screens; transitions: drum pass wipe, overprint build-up, misregistration storm, paper jam smear, sheet eject and feed. In the tradition of RISOGRAPH 007 (Riso Kagaku, 1986) · Print Gocco (Riso Kagaku, 1977) · Nieves zines (Zurich, Benjamin Sommerhalder) · Hato Press (London) · Colorama (Berlin) · Risotto Studio (Glasgow). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RISOGRAPH ANIMATION". Punchy sound design synced to every cut.
```
