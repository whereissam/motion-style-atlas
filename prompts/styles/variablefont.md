# Variable Font Motion

*Animated Type Axes · 2016 — · Typography & Text Motion*

Reference film: `videos/variablefont.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Variable Font Motion** (Animated Type Axes, 2016 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: OpenType Font Variations were announced jointly by Apple, Google, Microsoft and Adobe at ATypI Warsaw in 2016, letting one font file carry continuous design axes such as weight, width and optical size that can be animated like any other property.
- Study these reference works: Roboto Flex (Font Bureau / Google Fonts, 2022) · Decovar (David Berlow, 2017) · Amstelvar (David Berlow, 2016) · Bahnschrift (Aaron Bell / Microsoft, 2017) · DJR Font of the Month specimens
- Motion DNA: Letters never move position — they breathe in weight and width, waves travel through the word while every line stays locked to the frame edge.
- Visual DNA: Full-bleed grotesk on paper, ink and one signal red, specimen-sheet mono labels and axis sliders.
- Signature transitions: Hairline-to-black weight snaps, rows splitting and collapsing, width stretch to full bleed, hard cuts on the downbeat.
- Key techniques: Per-glyph wght / wdth interpolation, Justified rows solved to the frame edge, Phase-offset sine waves across glyphs

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-glyph wght / wdth interpolation, Justified rows solved to the frame edge, Phase-offset sine waves across glyphs).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-glyph wght / wdth interpolation and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VARIABLE FONT MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: CSS font-variation-settings, Canvas 2D, After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Variable Font Motion motion-graphics film (Animated Type Axes). Visual style: full-bleed grotesk on paper, ink and one signal red, specimen-sheet mono labels and axis sliders. Motion: letters never move position — they breathe in weight and width, waves travel through the word while every line stays locked to the frame edge. Signature moves: per-glyph wght / wdth interpolation, justified rows solved to the frame edge, phase-offset sine waves across glyphs; transitions: hairline-to-black weight snaps, rows splitting and collapsing, width stretch to full bleed, hard cuts on the downbeat. In the tradition of Roboto Flex (Font Bureau / Google Fonts, 2022) · Decovar (David Berlow, 2017) · Amstelvar (David Berlow, 2016) · Bahnschrift (Aaron Bell / Microsoft, 2017) · DJR Font of the Month specimens. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VARIABLE FONT MOTION". Punchy sound design synced to every cut.
```
