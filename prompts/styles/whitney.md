# Visual Music

*After John Whitney · 1921 — · Graphic Design & Historical*

Reference film: `videos/whitney.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Visual Music** (After John Whitney, 1921 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Abstract-film pioneers Ruttmann and Fischinger "played" music with shapes. In 1960 John Whitney founded Motion Graphics Inc. and gave the field its name.
- Study these reference works: An Optical Poem (1938) · Catalog (1961) · Arabesque (1975)
- Motion DNA: Each element rotates at a speed proportional to its index; patterns lock whenever the speeds form whole-number ratios.
- Visual DNA: Glowing points on black, rosette symmetry, warm-to-cool hue ramp, almost no type.
- Signature transitions: Symmetry lock, collapse to a line
- Key techniques: Differential motion, Symmetry locks, Additive trails

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Differential motion, Symmetry locks, Additive trails).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Differential motion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VISUAL MUSIC", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Processing, TouchDesigner. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Visual Music motion-graphics film (After John Whitney). Visual style: glowing points on black, rosette symmetry, warm-to-cool hue ramp, almost no type. Motion: each element rotates at a speed proportional to its index; patterns lock whenever the speeds form whole-number ratios. Signature moves: differential motion, symmetry locks, additive trails; transitions: symmetry lock, collapse to a line. In the tradition of An Optical Poem (1938) · Catalog (1961) · Arabesque (1975). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VISUAL MUSIC". Punchy sound design synced to every cut.
```
