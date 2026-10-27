# Isometric

*Axonometric Worlds · 1982 — · 2D Animation & Illustration*

Reference film: `videos/isometric.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Isometric** (Axonometric Worlds, 1982 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A 30° parallel projection from technical drawing became the go-to view for explaining systems, cities and products.
- Study these reference works: Zaxxon (1982) · SimCity 2000 (1993) · Monument Valley (2014)
- Motion DNA: Blocks drop and stack on the beat inside a fixed parallel projection; the camera only pans and zooms.
- Visual DNA: Limited pastel palette, 2:1 tiles, soft long shadows, tiny details.
- Signature transitions: Pull-back reveal, day-to-dusk relight
- Key techniques: 30° projection, Stacked build-up, Long soft shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (30° projection, Stacked build-up, Long soft shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 30° projection and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ISOMETRIC", held for about 1 s.

BUILD RULES
- Suggested tools: Illustrator, Canvas 2D, Blender. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Isometric motion-graphics film (Axonometric Worlds). Visual style: limited pastel palette, 2:1 tiles, soft long shadows, tiny details. Motion: blocks drop and stack on the beat inside a fixed parallel projection; the camera only pans and zooms. Signature moves: 30° projection, stacked build-up, long soft shadows; transitions: pull-back reveal, day-to-dusk relight. In the tradition of Zaxxon (1982) · SimCity 2000 (1993) · Monument Valley (2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ISOMETRIC". Punchy sound design synced to every cut.
```
