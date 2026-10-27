# Art Deco Motion

*Machine-age Glamour · 1925 — · Graphic Design & Historical*

Reference film: `videos/artdeco.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Art Deco Motion** (Machine-age Glamour, 1925 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Named after the 1925 Exposition Internationale des Arts Décoratifs in Paris, Art Deco fused Cubist geometry, Egyptian and Aztec motifs and machine-age streamlining; Cassandre's posters and New York's setback skyscrapers made it the look of luxury and speed.
- Study these reference works: Chrysler Building crown (William Van Alen, 1930) · "Normandie" poster (A. M. Cassandre, 1935) · "Étoile du Nord" poster (Cassandre, 1927) · Radio City Music Hall (1932) · The Great Gatsby titles (2013)
- Motion DNA: Everything grows from one axis in mirrored pairs: a plumb line falls, rays fan out on the beat, arches stack like a fanfare, lines streak outward, and a sheen sweeps the gold.
- Visual DNA: Gold on black: sunbursts, stepped ziggurats, chevrons, scallop fans and streamlines in strict bilateral symmetry, with high-contrast inline capitals.
- Signature transitions: Line draw-on from the axis, symmetrical bloom, mask-rise reveals, specular sweeps, slow camera pull-out.
- Key techniques: Mirror-symmetric draw-on of every ornament, Metallic gold gradients with a travelling sheen, Inline display type rising through a horizon mask, Additive bloom on gold line-work

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mirror-symmetric draw-on of every ornament, Metallic gold gradients with a travelling sheen, Inline display type rising through a horizon mask, Additive bloom on gold line-work).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mirror-symmetric draw-on of every ornament and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ART DECO MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, SVG, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Art Deco Motion motion-graphics film (Machine-age Glamour). Visual style: gold on black: sunbursts, stepped ziggurats, chevrons, scallop fans and streamlines in strict bilateral symmetry, with high-contrast inline capitals. Motion: everything grows from one axis in mirrored pairs: a plumb line falls, rays fan out on the beat, arches stack like a fanfare, lines streak outward, and a sheen sweeps the gold. Signature moves: mirror-symmetric draw-on of every ornament, metallic gold gradients with a travelling sheen, inline display type rising through a horizon mask, additive bloom on gold line-work; transitions: line draw-on from the axis, symmetrical bloom, mask-rise reveals, specular sweeps, slow camera pull-out. In the tradition of Chrysler Building crown (William Van Alen, 1930) · "Normandie" poster (A. M. Cassandre, 1935) · "Étoile du Nord" poster (Cassandre, 1927) · Radio City Music Hall (1932) · The Great Gatsby titles (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ART DECO MOTION". Punchy sound design synced to every cut.
```
