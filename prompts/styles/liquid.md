# Liquid Motion

*Metaballs · 2014 — · 2D Animation & Illustration*

Reference film: `videos/liquid.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Liquid Motion** (Metaballs, 2014 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Jim Blinn's 1982 "blobby objects" became a 2D transition trend, and later system UI.
- Study these reference works: Jim Blinn, blobby objects (1982) · Apple's Dynamic Island (2022)
- Motion DNA: Blobs attract, merge and pinch apart under a threshold field with elastic inertia.
- Visual DNA: Glossy gradient fluid, soft highlights, rounded type.
- Signature transitions: Liquid flood, condense into type
- Key techniques: Field + threshold, Merge & split, Liquid wipe

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Field + threshold, Merge & split, Liquid wipe).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Field + threshold and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LIQUID MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, WebGL, Canvas 2D, SVG filter. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Liquid Motion motion-graphics film (Metaballs). Visual style: glossy gradient fluid, soft highlights, rounded type. Motion: blobs attract, merge and pinch apart under a threshold field with elastic inertia. Signature moves: field + threshold, merge & split, liquid wipe; transitions: liquid flood, condense into type. In the tradition of Jim Blinn, blobby objects (1982) · Apple's Dynamic Island (2022). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LIQUID MOTION". Punchy sound design synced to every cut.
```
