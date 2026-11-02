# Soft Body

*A lattice of masses and springs · 1987 — · Technique Atlas*

Reference film: `videos/techsoftbody.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Soft Body** (A lattice of masses and springs, 1987 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Soft bodies are simulated as point masses joined by damped springs (or by constraints and pressure) and the picture is carried along by the deforming lattice. Demetri Terzopoulos, John Platt, Alan Barr and Kurt Fleischer’s Elastically Deformable Models (SIGGRAPH 1987) introduced physically based deformation to graphics, Gavin Miller animated snakes and worms with mass-spring segments the following year, and Matthias Müller and colleagues’ shape matching (2005) and position-based dynamics (2006) made stable, art-directable jelly routine in games and tools.
- Study these reference works: The Motion of Snakes and Worms (Gavin Miller, SIGGRAPH 1988) · LocoRoco (Sony, 2006) · World of Goo (2D Boy, 2008)
- Motion DNA: Two identical Tokens differ only in spring stiffness. Dropped on the beat, the soft one splats and wobbles for a second while the firm one gives a short shiver; plates press both with the same force — the soft one squashes to under two-thirds of its height and bulges, the firm one gives a few per cent — then lift away so the stored energy throws them up, and both ring down to their rest shape.
- Visual DNA: The Technique Atlas stage and floor; two orange Tokens carried on lattices of ink dots, springs tinted blue where compressed and orange where stretched; dashed rest-shape ghosts, height callouts h / h₀, two ink press plates on rods with force arrows, mono stiffness labels under each body.
- Signature transitions: Held, dropped, pressed, released, recovered — the soft body’s height graph traces the story
- Key techniques: Mass-spring lattice: structural, shear, bend, Per-triangle area springs against collapse, Texture embedded in the lattice cells

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mass-spring lattice: structural, shear, bend, Per-triangle area springs against collapse, Texture embedded in the lattice cells).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mass-spring lattice: structural, shear, bend and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SOFT BODY", held for about 1 s.

BUILD RULES
- Suggested tools: Mass-spring lattice with area springs precomputed in setup (24 substeps, semi-implicit Euler), Penalty contact for the force-driven plates, projected floor with friction, Canvas 2D: affine texture-mapped lattice triangles, strain-coloured spring overlay. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Soft Body motion-graphics film (A lattice of masses and springs). Visual style: the Technique Atlas stage and floor; two orange Tokens carried on lattices of ink dots, springs tinted blue where compressed and orange where stretched; dashed rest-shape ghosts, height callouts h / h₀, two ink press plates on rods with force arrows, mono stiffness labels under each body. Motion: two identical Tokens differ only in spring stiffness. Dropped on the beat, the soft one splats and wobbles for a second while the firm one gives a short shiver; plates press both with the same force — the soft one squashes to under two-thirds of its height and bulges, the firm one gives a few per cent — then lift away so the stored energy throws them up, and both ring down to their rest shape. Signature moves: mass-spring lattice: structural, shear, bend, per-triangle area springs against collapse, texture embedded in the lattice cells; transitions: held, dropped, pressed, released, recovered — the soft body’s height graph traces the story. In the tradition of The Motion of Snakes and Worms (Gavin Miller, SIGGRAPH 1988) · LocoRoco (Sony, 2006) · World of Goo (2D Boy, 2008). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SOFT BODY". Punchy sound design synced to every cut.
```
