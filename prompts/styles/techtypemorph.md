# Type Morph

*Glyphs interpolated along weight, width and shape · 1977 — · Technique Atlas*

Reference film: `videos/techtypemorph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Type Morph** (Glyphs interpolated along weight, width and shape, 1977 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Donald Knuth’s METAFONT (first version 1977–79) described letters as pen strokes along skeleton paths, so weight and width became parameters instead of separate drawings. Adobe’s Multiple Master fonts (1991) interpolated between drawn master outlines along design axes, Apple’s TrueType GX variations followed in the mid-1990s, and OpenType Font Variations — variable fonts, announced jointly by Adobe, Apple, Google and Microsoft in 2016 — made registered axes such as weight (wght) and width (wdth) standard, and animatable on screen.
- Study these reference works: METAFONT and Computer Modern (Donald Knuth, 1977–86) · Myriad MM (Robert Slimbach and Carol Twombly, Adobe, 1992; weight and width Multiple Master axes) · OpenType Font Variations (Adobe, Apple, Google and Microsoft, 2016)
- Motion DNA: Three axes moved one at a time, then two at once. The weight axis eases from 100 to 900 over a bar and the letters swell around fixed skeletons while the word grows with its advances; the width axis squeezes to 60 and stretches to 150 with a small overshoot home; M and O morph into A and C and back while the shared TION never moves; finally weight and width travel together on a curved path back to the start.
- Visual DNA: The Technique Atlas stage with MOTION drawn as ink pen strokes over thin orange skeletons with sample dots, dashed advance boxes, cap-height and baseline guides; three sliders below (wght, wdth, glyph) with the Token as their knobs; a design-space inset top-right plotting wght × wdth with the film’s path traced in orange.
- Signature transitions: Continuous axis interpolation; glyph-to-glyph point morph with an overshooting return
- Key techniques: Skeleton + pen width, Design-space axes, Glyph-to-glyph point correspondence

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Skeleton + pen width, Design-space axes, Glyph-to-glyph point correspondence).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Skeleton + pen width and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TYPE MORPH", held for about 1 s.

BUILD RULES
- Suggested tools: Variable fonts: CSS font-variation-settings / animated wght and wdth axes, Font editors (Glyphs, FontLab): masters, compatible outlines and interpolation, Canvas 2D: stroked skeletons resampled to 64 points, lerped per point. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Type Morph motion-graphics film (Glyphs interpolated along weight, width and shape). Visual style: the Technique Atlas stage with MOTION drawn as ink pen strokes over thin orange skeletons with sample dots, dashed advance boxes, cap-height and baseline guides; three sliders below (wght, wdth, glyph) with the Token as their knobs; a design-space inset top-right plotting wght × wdth with the film’s path traced in orange. Motion: three axes moved one at a time, then two at once. The weight axis eases from 100 to 900 over a bar and the letters swell around fixed skeletons while the word grows with its advances; the width axis squeezes to 60 and stretches to 150 with a small overshoot home; M and O morph into A and C and back while the shared TION never moves; finally weight and width travel together on a curved path back to the start. Signature moves: skeleton + pen width, design-space axes, glyph-to-glyph point correspondence; transitions: continuous axis interpolation; glyph-to-glyph point morph with an overshooting return. In the tradition of METAFONT and Computer Modern (Donald Knuth, 1977–86) · Myriad MM (Robert Slimbach and Carol Twombly, Adobe, 1992; weight and width Multiple Master axes) · OpenType Font Variations (Adobe, Apple, Google and Microsoft, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TYPE MORPH". Punchy sound design synced to every cut.
```
