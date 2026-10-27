# Bauhaus Geometry

*Primary Shapes in Rhythm · 1919 — · Graphic Design & Historical*

Reference film: `videos/bauhaus.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Bauhaus Geometry** (Primary Shapes in Rhythm, 1919 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The Bauhaus reduced form to circle, square and triangle in primary colours. Brand-identity motion still runs on that alphabet.
- Study these reference works: Kandinsky, Composition VIII (1923) · Schlemmer, Triadic Ballet (1922)
- Motion DNA: Shapes snap, roll and rotate on an 8th-note grid; every move lands exactly on the beat.
- Visual DNA: Red, yellow, blue and black on off-white; overprinted shapes; geometric sans.
- Signature transitions: Panel push-wipe, tile rotation waves
- Key techniques: Primary palette, Shape snapping, Poster resolve

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Primary palette, Shape snapping, Poster resolve).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Primary palette and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BAUHAUS GEOMETRY", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, SVG, Canvas 2D, CSS. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Bauhaus Geometry motion-graphics film (Primary Shapes in Rhythm). Visual style: red, yellow, blue and black on off-white; overprinted shapes; geometric sans. Motion: shapes snap, roll and rotate on an 8th-note grid; every move lands exactly on the beat. Signature moves: primary palette, shape snapping, poster resolve; transitions: panel push-wipe, tile rotation waves. In the tradition of Kandinsky, Composition VIII (1923) · Schlemmer, Triadic Ballet (1922). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BAUHAUS GEOMETRY". Punchy sound design synced to every cut.
```
