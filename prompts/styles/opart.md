# Op Art Kinetic

*Optical Vibration · 1960 — · Graphic Design & Historical*

Reference film: `videos/opart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Op Art Kinetic** (Optical Vibration, 1960 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Op (optical) art used precise black-and-white geometry to make flat paintings appear to move, swell and flicker on the retina; Bridget Riley and Victor Vasarely led it, and MoMA’s 1965 exhibition The Responsive Eye made it a global sensation.
- Study these reference works: Movement in Squares (Bridget Riley, 1961) · Current (Bridget Riley, 1964) · Fall (Bridget Riley, 1963) · Vega series (Victor Vasarely, 1957—) · The Responsive Eye (MoMA, 1965)
- Motion DNA: Precise, vibrating motion: periods collapse in clicks, lines undulate, squares fold and bulge, and two ring fields beat against each other until they lock still.
- Visual DNA: Pure black and white: dense parallel stripes, compressed checkerboards, spherical bulges and concentric rings, no colour and no texture.
- Signature transitions: Period-doubling, slanted wipe, fold relax into bulge, iris to moiré, ring flattening to stripes, phase-shift reveal
- Key techniques: Analytic anti-aliased stripe fields, Moiré interference, Lens-warped checkerboards

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic anti-aliased stripe fields, Moiré interference, Lens-warped checkerboards).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic anti-aliased stripe fields and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OP ART KINETIC", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL, Canvas 2D, After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Op Art Kinetic motion-graphics film (Optical Vibration). Visual style: pure black and white: dense parallel stripes, compressed checkerboards, spherical bulges and concentric rings, no colour and no texture. Motion: precise, vibrating motion: periods collapse in clicks, lines undulate, squares fold and bulge, and two ring fields beat against each other until they lock still. Signature moves: analytic anti-aliased stripe fields, moiré interference, lens-warped checkerboards; transitions: period-doubling, slanted wipe, fold relax into bulge, iris to moiré, ring flattening to stripes, phase-shift reveal. In the tradition of Movement in Squares (Bridget Riley, 1961) · Current (Bridget Riley, 1964) · Fall (Bridget Riley, 1963) · Vega series (Victor Vasarely, 1957—) · The Responsive Eye (MoMA, 1965). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OP ART KINETIC". Punchy sound design synced to every cut.
```
