# Typographic Collage

*Parole in Libertà · 1912 — · Typography & Text Motion*

Reference film: `videos/typocollage.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Typographic Collage** (Parole in Libertà, 1912 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: F. T. Marinetti’s Futurist “words-in-freedom” (from 1912; Zang Tumb Tuuum, 1914) broke the line of type into onomatopoeia, mathematical signs and mixed faces flung along diagonals; Dada and Russian Constructivist typographers cut and pasted found print, and 1970s punk flyers (Jamie Reid, Linder) turned ransom-note letters, ticket stubs and tape into a xerox vernacular. Motion designers animate it as stop-motion paste-up, a piece per frame.
- Study these reference works: F. T. Marinetti, Zang Tumb Tuuum (1914) · Marinetti, Les mots en liberté futuristes (1919) · Kurt Schwitters, Merz collages (1919 —) · Jamie Reid, sleeve and poster art for the Sex Pistols (1977) · Barbara Kruger, Untitled works (1980s)
- Motion DNA: Paste-up on twos: each scrap slaps down in two or three held frames, dropping out of focus and shadow, the camera stepping with it; words are spelled one found letter at a time along diagonals, a vowel stretches by repetition, and a sheet slides in whole to clear space for the title.
- Visual DNA: Wood type with grain in the ink, Bodoni and Anton headline cut-outs, newspaper columns, halftone, ticket stubs with perforations and masking tape on a newsprint table, in black, cream and Futurist red with the paper’s white core showing on torn edges.
- Signature transitions: Slap-down, word build, rule burst, sheet slide-over, strip paste and tape
- Key techniques: Found letters, one face per glyph, Torn and scissor-cut edges, Stop-motion on twos (12 fps), Diagonal Futurist composition

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Found letters, one face per glyph, Torn and scissor-cut edges, Stop-motion on twos (12 fps), Diagonal Futurist composition).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Found letters, one face per glyph and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TYPOGRAPHIC COLLAGE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (stop-motion paste-up), Scanned print ephemera, Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Typographic Collage motion-graphics film (Parole in Libertà). Visual style: wood type with grain in the ink, Bodoni and Anton headline cut-outs, newspaper columns, halftone, ticket stubs with perforations and masking tape on a newsprint table, in black, cream and Futurist red with the paper’s white core showing on torn edges. Motion: paste-up on twos: each scrap slaps down in two or three held frames, dropping out of focus and shadow, the camera stepping with it; words are spelled one found letter at a time along diagonals, a vowel stretches by repetition, and a sheet slides in whole to clear space for the title. Signature moves: found letters, one face per glyph, torn and scissor-cut edges, stop-motion on twos (12 fps), diagonal futurist composition; transitions: slap-down, word build, rule burst, sheet slide-over, strip paste and tape. In the tradition of F. T. Marinetti, Zang Tumb Tuuum (1914) · Marinetti, Les mots en liberté futuristes (1919) · Kurt Schwitters, Merz collages (1919 —) · Jamie Reid, sleeve and poster art for the Sex Pistols (1977) · Barbara Kruger, Untitled works (1980s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TYPOGRAPHIC COLLAGE". Punchy sound design synced to every cut.
```
