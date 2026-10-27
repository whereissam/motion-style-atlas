# Cellular Automata

*Conway's Game of Life · 1970 — · Experimental & Generative*

Reference film: `videos/lifegame.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cellular Automata** (Conway's Game of Life, 1970 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: John Horton Conway devised the Game of Life in 1970 and Martin Gardner published it in his October 1970 "Mathematical Games" column in Scientific American; one rule, B3/S23 on a square grid, produces gliders, guns and self-sustaining machines.
- Study these reference works: Martin Gardner, Mathematical Games: The fantastic combinations of John Conway's new solitaire game "life" (Scientific American, Oct 1970) · Bill Gosper, Gosper glider gun (1970) · Golly (open-source Life simulator) · Stephen Wolfram, A New Kind of Science (2002) · Paul Rendell, Turing machine in Life (2000)
- Motion DNA: Time is quantised into generations: each tick every cell is born, survives or dies by counting neighbours, and cells ease in and out between ticks while the camera pulls back to show the machines at scale.
- Visual DNA: A dark lab grid of square cells glowing like phosphor, hot amber newborns cooling to mint, with mono annotations naming each pattern.
- Signature transitions: Generation tick, exponential zoom-out, chaos burst, settling sweep, block-letter crystallisation
- Key techniques: B3/S23 rule on a bit grid, Soft birth/death interpolation, Exponential zoom-out

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (B3/S23 rule on a bit grid, Soft birth/death interpolation, Exponential zoom-out).
- 5.0–8.0 s  Climax: the most spectacular moment, built on B3/S23 rule on a bit grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CELLULAR AUTOMATA", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL, Golly, TouchDesigner. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cellular Automata motion-graphics film (Conway's Game of Life). Visual style: a dark lab grid of square cells glowing like phosphor, hot amber newborns cooling to mint, with mono annotations naming each pattern. Motion: time is quantised into generations: each tick every cell is born, survives or dies by counting neighbours, and cells ease in and out between ticks while the camera pulls back to show the machines at scale. Signature moves: b3/s23 rule on a bit grid, soft birth/death interpolation, exponential zoom-out; transitions: generation tick, exponential zoom-out, chaos burst, settling sweep, block-letter crystallisation. In the tradition of Martin Gardner, Mathematical Games: The fantastic combinations of John Conway's new solitaire game "life" (Scientific American, Oct 1970) · Bill Gosper, Gosper glider gun (1970) · Golly (open-source Life simulator) · Stephen Wolfram, A New Kind of Science (2002) · Paul Rendell, Turing machine in Life (2000). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CELLULAR AUTOMATA". Punchy sound design synced to every cut.
```
