# Collage

*Cut-out Mixed Media · 1969 — · 2D Animation & Illustration*

Reference film: `videos/collage.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Collage** (Cut-out Mixed Media, 1969 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Terry Gilliam's cut-out animation for Monty Python's Flying Circus made jerky paper puppets a comic language.
- Study these reference works: Monty Python's Flying Circus (1969 — 1974)
- Motion DNA: Rigid cut-outs hinge at joints and move in stepped, deliberately crude frames.
- Visual DNA: Halftone dots, newsprint, torn edges, mismatched scale, paper shadows.
- Signature transitions: Paper tear, giant-object gag
- Key techniques: Torn paper, Halftone texture, Hinged cut-outs

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Torn paper, Halftone texture, Hinged cut-outs).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Torn paper and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "COLLAGE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Photoshop. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + collage assets.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Collage motion-graphics film (Cut-out Mixed Media). Visual style: halftone dots, newsprint, torn edges, mismatched scale, paper shadows. Motion: rigid cut-outs hinge at joints and move in stepped, deliberately crude frames. Signature moves: torn paper, halftone texture, hinged cut-outs; transitions: paper tear, giant-object gag. In the tradition of Monty Python's Flying Circus (1969 — 1974). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "COLLAGE". Punchy sound design synced to every cut.
```
