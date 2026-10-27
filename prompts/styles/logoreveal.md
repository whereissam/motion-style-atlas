# Logo Reveal

*Brand Sting & Studio Ident · 1930s — · Social & Commercial*

Reference film: `videos/logoreveal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Logo Reveal** (Brand Sting & Studio Ident, 1930s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Film studios turned their trademark into a few seconds of ceremony: the 20th Century Fox searchlight-and-fanfare ident (1935), MGM’s roaring lion and later Netflix’s “ta-dum” sonic logo with its 2019 ribbon ident. Identity studios such as Pentagram made the reveal a demonstration of the mark’s own geometry, so the logo appears to build itself from its construction.
- Study these reference works: 20th Century Fox ident and fanfare (Alfred Newman, 1933/1935) · MGM “Leo the Lion” · Netflix “ta-dum” sonic logo (2015) and ribbon ident (2019) · Pentagram identity motion for MIT Media Lab (2014) · Pixar’s Luxo Jr. lamp ident
- Motion DNA: Build-up, then one landing: construction lines and a pen trace lead to the moment the sun-dot springs in on the final note of the sonic logo, after which everything settles and holds still.
- Visual DNA: A geometric monogram on warm paper, ink black with one signal orange, a hairline grid, mono-type spec labels and a tightly kerned geometric sans wordmark.
- Signature transitions: Hard cuts between alternate takes, construction lines dissolving into the fill, light sweep, spring slide to lock-up.
- Key techniques: Mark defined by two tangent circles, reused for every take, Compass-swept construction circles and dimension guides, Outline traced with a line-dash pen, then an ink fill along the path, Source-atop light sweep; glyph-by-glyph tracking with font kerning kept

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mark defined by two tangent circles, reused for every take, Compass-swept construction circles and dimension guides, Outline traced with a line-dash pen, then an ink fill along the path, Source-atop light sweep; glyph-by-glyph tracking with font kerning kept).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mark defined by two tangent circles, reused for every take and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LOGO REVEAL", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Cinema 4D, Lottie. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Logo Reveal motion-graphics film (Brand Sting & Studio Ident). Visual style: a geometric monogram on warm paper, ink black with one signal orange, a hairline grid, mono-type spec labels and a tightly kerned geometric sans wordmark. Motion: build-up, then one landing: construction lines and a pen trace lead to the moment the sun-dot springs in on the final note of the sonic logo, after which everything settles and holds still. Signature moves: mark defined by two tangent circles, reused for every take, compass-swept construction circles and dimension guides, outline traced with a line-dash pen, then an ink fill along the path, source-atop light sweep; glyph-by-glyph tracking with font kerning kept; transitions: hard cuts between alternate takes, construction lines dissolving into the fill, light sweep, spring slide to lock-up. In the tradition of 20th Century Fox ident and fanfare (Alfred Newman, 1933/1935) · MGM “Leo the Lion” · Netflix “ta-dum” sonic logo (2015) and ribbon ident (2019) · Pentagram identity motion for MIT Media Lab (2014) · Pixar’s Luxo Jr. lamp ident. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LOGO REVEAL". Punchy sound design synced to every cut.
```
