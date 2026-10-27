# Swiss Kinetic Type

*International Typographic Style · 1959 — · Typography & Text Motion*

Reference film: `videos/swiss.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Swiss Kinetic Type** (International Typographic Style, 1959 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The grid and sans-serif of Swiss graphic design, first set in motion by the North by Northwest title sequence.
- Study these reference works: North by Northwest titles (1959) · Se7en titles (1995)
- Motion DNA: Letters push through masks with fast-out eases and snap to grid columns on the beat.
- Visual DNA: Black, white and one red; 12-column grid; heavy grotesque against tiny captions.
- Signature transitions: Invert cut, slice offset, marquee step
- Key techniques: Mask reveals, Letter stagger, Grid snapping

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mask reveals, Letter stagger, Grid snapping).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mask reveals and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SWISS KINETIC TYPE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, CSS, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Swiss Kinetic Type motion-graphics film (International Typographic Style). Visual style: black, white and one red; 12-column grid; heavy grotesque against tiny captions. Motion: letters push through masks with fast-out eases and snap to grid columns on the beat. Signature moves: mask reveals, letter stagger, grid snapping; transitions: invert cut, slice offset, marquee step. In the tradition of North by Northwest titles (1959) · Se7en titles (1995). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SWISS KINETIC TYPE". Punchy sound design synced to every cut.
```
