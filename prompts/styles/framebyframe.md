# Frame by Frame

*Straight-ahead on Twos · 1908 — · 2D Animation & Illustration*

Reference film: `videos/framebyframe.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Frame by Frame** (Straight-ahead on Twos, 1908 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Every frame drawn by hand: since Émile Cohl’s Fantasmagorie and Winsor McCay’s Gertie, animators have drawn on punched paper over a light table and flipped the pages to feel the motion. Pencil tests check timing before anything is cleaned up; Richard Williams codified the craft in The Animator’s Survival Kit, while Bill Plympton’s boiling pencil and Ryan Woodward’s Thought of You leave the rough line on screen.
- Study these reference works: Fantasmagorie (Émile Cohl, 1908) · Gertie the Dinosaur (Winsor McCay, 1914) · Your Face (Bill Plympton, 1987) · The Man Who Planted Trees (Frédéric Back, 1987) · The Animator’s Survival Kit (Richard Williams, 2001) · Thought of You (Ryan Woodward, 2010)
- Motion DNA: Twelve drawings a second, each held for two frames: a straight-ahead flow from one drawing to the next, squash on contact and stretch on the fall, spacing that eases out of every arc, and a line that never sits still because no two drawings are traced exactly alike.
- Visual DNA: Warm animation bond on brass pegs over a light table, blue construction pencil under graphite, red and blue onion skins of the neighbouring drawings, an exposure sheet filling in down the side and hand-lettered notes in the margins.
- Signature transitions: Sheet drop onto pegs, ball-to-character metamorphosis, 2D squash turn, chronophotographic overlay, letter-by-letter title
- Key techniques: Bouncing-ball arcs and spacing, Onion skins either side, Boiling line on twos

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Bouncing-ball arcs and spacing, Onion skins either side, Boiling line on twos).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Bouncing-ball arcs and spacing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRAME BY FRAME", held for about 1 s.

BUILD RULES
- Suggested tools: Pencil on punched paper, light table and line tester, TVPaint / Toon Boom Harmony / Procreate Dreams, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (boil and registration jitter are seeded per drawing).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Frame by Frame motion-graphics film (Straight-ahead on Twos). Visual style: warm animation bond on brass pegs over a light table, blue construction pencil under graphite, red and blue onion skins of the neighbouring drawings, an exposure sheet filling in down the side and hand-lettered notes in the margins. Motion: twelve drawings a second, each held for two frames: a straight-ahead flow from one drawing to the next, squash on contact and stretch on the fall, spacing that eases out of every arc, and a line that never sits still because no two drawings are traced exactly alike. Signature moves: bouncing-ball arcs and spacing, onion skins either side, boiling line on twos; transitions: sheet drop onto pegs, ball-to-character metamorphosis, 2D squash turn, chronophotographic overlay, letter-by-letter title. In the tradition of Fantasmagorie (Émile Cohl, 1908) · Gertie the Dinosaur (Winsor McCay, 1914) · Your Face (Bill Plympton, 1987) · The Man Who Planted Trees (Frédéric Back, 1987) · The Animator’s Survival Kit (Richard Williams, 2001) · Thought of You (Ryan Woodward, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRAME BY FRAME". Punchy sound design synced to every cut.
```
