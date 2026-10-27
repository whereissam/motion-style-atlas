# Exploded-view Animation

*Product Visualisation · 1500s / 1990s — · 3D & CGI Motion*

Reference film: `videos/exploded.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Exploded-view Animation** (Product Visualisation, 1500s / 1990s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The exploded view comes from technical illustration (Leonardo’s machine studies, Agostino Ramelli, later engineering manuals); CAD and 3D product rendering in the 1990s–2000s turned it into motion, and Apple’s product films made the slow, precise disassembly a signature of premium launches.
- Study these reference works: Leonardo da Vinci, Codex Atlanticus (c. 1478–1519) · Apple “Designed by Apple in California” product films (2013) · Apple Watch launch film (2014) · Leica SL / Sony G Master lens cutaway animations · Teenage Engineering OP-1 exploded renders
- Motion DNA: A product holds, then its parts separate along the optical axis in a precise staggered cascade, labels draw on with leader lines, the assembly orbits, and everything snaps home with one satisfying click.
- Visual DNA: Seamless light studio, black anodised metal against chrome and copper, coated glass reflections, hairline leader lines and small engineering type.
- Signature transitions: Axial explode, leader-line draw-on, orbit, staggered re-assembly snap, light flash on the click.
- Key techniques: Surfaces of revolution from closed (r, z) profiles, Global painter’s sort of ~4k shaded quads, Studio environment-map shading: chrome, anodised, copper, coated glass

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Surfaces of revolution from closed (r, z) profiles, Global painter’s sort of ~4k shaded quads, Studio environment-map shading: chrome, anodised, copper, coated glass).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Surfaces of revolution from closed (r, z) profiles and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EXPLODED-VIEW ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D / Redshift, KeyShot, SolidWorks Visualize, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Exploded-view Animation motion-graphics film (Product Visualisation). Visual style: seamless light studio, black anodised metal against chrome and copper, coated glass reflections, hairline leader lines and small engineering type. Motion: a product holds, then its parts separate along the optical axis in a precise staggered cascade, labels draw on with leader lines, the assembly orbits, and everything snaps home with one satisfying click. Signature moves: surfaces of revolution from closed (r, z) profiles, global painter’s sort of ~4k shaded quads, studio environment-map shading: chrome, anodised, copper, coated glass; transitions: axial explode, leader-line draw-on, orbit, staggered re-assembly snap, light flash on the click. In the tradition of Leonardo da Vinci, Codex Atlanticus (c. 1478–1519) · Apple “Designed by Apple in California” product films (2013) · Apple Watch launch film (2014) · Leica SL / Sony G Master lens cutaway animations · Teenage Engineering OP-1 exploded renders. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EXPLODED-VIEW ANIMATION". Punchy sound design synced to every cut.
```
