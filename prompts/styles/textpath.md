# Text-on-Path Motion

*Type Along a Curve · 1958 — · Typography & Text Motion*

Reference film: `videos/textpath.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Text-on-Path Motion** (Type Along a Curve, 1958 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Letters that ride a line instead of a baseline. Calligrams bent verse into pictures, Saul Bass and John Whitney built the Vertigo (1958) titles around turning spirals, and 1990s title designers such as Kyle Cooper made type itself a moving line. After Effects 6.0 (2003) brought text layers with Path Options, and ribbons, spirals and rotating rings of words became a staple of brand films.
- Study these reference works: Calligrammes (Guillaume Apollinaire, 1918) · Vertigo title sequence (Saul Bass & John Whitney, 1958) · Kyle Cooper / Imaginary Forces title work (1996 —) · After Effects text Path Options (Adobe, 2003) · SVG <textPath> (W3C, 2001)
- Motion DNA: Letters never move on their own: the path moves and the type flows along it — a line draws on, swells into a looping ribbon, winds into a turning spiral, collapses to a point and snaps shut as a rotating ring.
- Visual DNA: Heavy grotesk and an italic serif riding vermilion and ultramarine bands on warm paper; Bass-like flat shapes, hairline guides and a single circular seal.
- Signature transitions: Path draw-on, path morph, spiral collapse, ring burst, letters riding arcs into a lock-up
- Key techniques: Arc-length glyph placement, Perpendicular-to-path rotation, Path morph & first-margin flow, Ribbon band with knocked-out letters

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Arc-length glyph placement, Perpendicular-to-path rotation, Path morph & first-margin flow, Ribbon band with knocked-out letters).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Arc-length glyph placement and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEXT-ON-PATH MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (Path Options), SVG textPath, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Text-on-Path Motion motion-graphics film (Type Along a Curve). Visual style: heavy grotesk and an italic serif riding vermilion and ultramarine bands on warm paper; Bass-like flat shapes, hairline guides and a single circular seal. Motion: letters never move on their own: the path moves and the type flows along it — a line draws on, swells into a looping ribbon, winds into a turning spiral, collapses to a point and snaps shut as a rotating ring. Signature moves: arc-length glyph placement, perpendicular-to-path rotation, path morph & first-margin flow, ribbon band with knocked-out letters; transitions: path draw-on, path morph, spiral collapse, ring burst, letters riding arcs into a lock-up. In the tradition of Calligrammes (Guillaume Apollinaire, 1918) · Vertigo title sequence (Saul Bass & John Whitney, 1958) · Kyle Cooper / Imaginary Forces title work (1996 —) · After Effects text Path Options (Adobe, 2003) · SVG <textPath> (W3C, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEXT-ON-PATH MOTION". Punchy sound design synced to every cut.
```
