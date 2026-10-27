# Monoline Line Art

*One Continuous Stroke · 1971 — · 2D Animation & Illustration*

Reference film: `videos/lineart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Monoline Line Art** (One Continuous Stroke, 1971 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: From Osvaldo Cavandoli's La Linea to modern trim-path brand films: one constant line that draws, morphs and redraws.
- Study these reference works: La Linea (1971) · Picasso light drawings for LIFE (1949)
- Motion DNA: A single path grows by trim and re-forms point by point into the next object.
- Visual DNA: One colour stroke, round caps, constant weight, generous empty space.
- Signature transitions: Point-wise morph, retract-and-redraw
- Key techniques: Stroke draw-on, Line morphing, Negative space

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Stroke draw-on, Line morphing, Negative space).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Stroke draw-on and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MONOLINE LINE ART", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, SVG, Lottie. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Monoline Line Art motion-graphics film (One Continuous Stroke). Visual style: one colour stroke, round caps, constant weight, generous empty space. Motion: a single path grows by trim and re-forms point by point into the next object. Signature moves: stroke draw-on, line morphing, negative space; transitions: point-wise morph, retract-and-redraw. In the tradition of La Linea (1971) · Picasso light drawings for LIFE (1949). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MONOLINE LINE ART". Punchy sound design synced to every cut.
```
