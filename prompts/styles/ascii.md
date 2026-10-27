# ASCII Motion

*Luminance as Characters · 1966 — · Typography & Text Motion*

Reference film: `videos/ascii.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **ASCII Motion** (Luminance as Characters, 1966 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born when Kenneth Knowlton and Leon Harmon built pictures from printed symbols at Bell Labs in 1966, then carried on through teletype art, BBS ANSI scenes, the demoscene and real-time converters such as AAlib.
- Study these reference works: Studies in Perception I (Knowlton & Harmon, 1966) · ASCII Star Wars (Simon Jansen, 1997) · AAlib / BB demo (1997) · donut.c (Andy Sloane, 2006) · FIGlet banners (1991)
- Motion DNA: Nothing moves but the character in each fixed cell: motion is luminance changing glyphs on a rigid monospace grid.
- Visual DNA: Phosphor green on black with bloom and scanlines, density ramps from dot to @, then full-colour lolcat scans.
- Signature transitions: Character dissolve, scanline colour wipe, matrix-rain cascade, banner rain-in.
- Key techniques: Per-cell raymarched SDF, Luminance → glyph density ramp, Column cascade + banner reassembly

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-cell raymarched SDF, Luminance → glyph density ramp, Column cascade + banner reassembly).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-cell raymarched SDF and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ASCII MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL shader, Terminal. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second ASCII Motion motion-graphics film (Luminance as Characters). Visual style: phosphor green on black with bloom and scanlines, density ramps from dot to @, then full-colour lolcat scans. Motion: nothing moves but the character in each fixed cell: motion is luminance changing glyphs on a rigid monospace grid. Signature moves: per-cell raymarched sdf, luminance → glyph density ramp, column cascade + banner reassembly; transitions: character dissolve, scanline colour wipe, matrix-rain cascade, banner rain-in. In the tradition of Studies in Perception I (Knowlton & Harmon, 1966) · ASCII Star Wars (Simon Jansen, 1997) · AAlib / BB demo (1997) · donut.c (Andy Sloane, 2006) · FIGlet banners (1991). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ASCII MOTION". Punchy sound design synced to every cut.
```
