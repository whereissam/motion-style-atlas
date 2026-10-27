# Memphis Design

*Postmodern Pop Pattern · 1981 — 1988 · Graphic Design & Historical*

Reference film: `videos/memphis.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Memphis Design** (Postmodern Pop Pattern, 1981 — 1988; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A Milan design collective founded by Ettore Sottsass in December 1980 and launched at the 1981 Salone del Mobile; it threw out good-taste modernism for laminate patterns, clashing colours and toy-like geometry, and its look later flooded 1980s TV graphics and packaging.
- Study these reference works: Carlton room divider (Ettore Sottsass, 1981) · Bacterio laminate (Ettore Sottsass, 1978) · Gabon & Zambia patterns (Nathalie Du Pasquier, 1982) · Super lamp (Martine Bedin, 1981) · Saved by the Bell title graphics (NBC, 1989)
- Motion DNA: Bouncy and overshoot-heavy: shapes drop with squash and stretch, slide in past their mark and spring back, all locked to a synth-pop beat.
- Visual DNA: Pastel and primary clashes, black-and-white laminate patterns, squiggles, confetti terrazzo, zig-zags, cylinders, cones and half-moons with hard black shadows.
- Signature transitions: Pattern panel slide, spring pop, drop-and-bounce, palette clash flash, confetti burst
- Key techniques: Laminate patterns: squiggle, terrazzo, grid, dots, Hard offset shadows & black keylines, Squash-and-stretch bounce stacking

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Laminate patterns: squiggle, terrazzo, grid, dots, Hard offset shadows & black keylines, Squash-and-stretch bounce stacking).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Laminate patterns: squiggle, terrazzo, grid, dots and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MEMPHIS DESIGN", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Illustrator. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Memphis Design motion-graphics film (Postmodern Pop Pattern). Visual style: pastel and primary clashes, black-and-white laminate patterns, squiggles, confetti terrazzo, zig-zags, cylinders, cones and half-moons with hard black shadows. Motion: bouncy and overshoot-heavy: shapes drop with squash and stretch, slide in past their mark and spring back, all locked to a synth-pop beat. Signature moves: laminate patterns: squiggle, terrazzo, grid, dots, hard offset shadows & black keylines, squash-and-stretch bounce stacking; transitions: pattern panel slide, spring pop, drop-and-bounce, palette clash flash, confetti burst. In the tradition of Carlton room divider (Ettore Sottsass, 1981) · Bacterio laminate (Ettore Sottsass, 1978) · Gabon & Zambia patterns (Nathalie Du Pasquier, 1982) · Super lamp (Martine Bedin, 1981) · Saved by the Bell title graphics (NBC, 1989). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MEMPHIS DESIGN". Punchy sound design synced to every cut.
```
