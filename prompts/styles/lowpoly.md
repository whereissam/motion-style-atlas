# Low Poly

*Faceted Geometry · 1990s — · 3D & CGI Motion*

Reference film: `videos/lowpoly.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Low Poly** (Faceted Geometry, 1990s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born of the polygon budgets of early real-time 3D (Virtua Fighter, the PlayStation era), low poly returned in the 2010s as a deliberate aesthetic: flat-shaded triangles, visible facets and pastel light.
- Study these reference works: Virtua Fighter (Sega, 1993) · Monument Valley (ustwo, 2014) · Alto’s Adventure (2015) · Firewatch key art (Olly Moss, 2016)
- Motion DNA: A smooth drone flyover that cranes up to reveal the range, then the world shatters into a triangle mosaic and an icon assembles facet by facet.
- Visual DNA: Flat-shaded triangles, warm key light against cool shadow sides, pastel sunset haze and a faceted sun.
- Signature transitions: Triangle mosaic wipe, facet-by-facet assembly, crane reveal, sun flare.
- Key techniques: Seeded fBm terrain on a jittered grid, Per-face Lambert shading + atmospheric fog, Painter’s depth sort of ~9k triangles

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Seeded fBm terrain on a jittered grid, Per-face Lambert shading + atmospheric fog, Painter’s depth sort of ~9k triangles).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Seeded fBm terrain on a jittered grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LOW POLY", held for about 1 s.

BUILD RULES
- Suggested tools: Blender (Decimate / flat shading), Cinema 4D, Three.js flatShading, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Low Poly motion-graphics film (Faceted Geometry). Visual style: flat-shaded triangles, warm key light against cool shadow sides, pastel sunset haze and a faceted sun. Motion: a smooth drone flyover that cranes up to reveal the range, then the world shatters into a triangle mosaic and an icon assembles facet by facet. Signature moves: seeded fbm terrain on a jittered grid, per-face lambert shading + atmospheric fog, painter’s depth sort of ~9k triangles; transitions: triangle mosaic wipe, facet-by-facet assembly, crane reveal, sun flare. In the tradition of Virtua Fighter (Sega, 1993) · Monument Valley (ustwo, 2014) · Alto’s Adventure (2015) · Firewatch key art (Olly Moss, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LOW POLY". Punchy sound design synced to every cut.
```
