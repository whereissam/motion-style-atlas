# Editorial Typography

*The Magazine Page in Motion · 1934 — · Typography & Text Motion*

Reference film: `videos/editorial.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Editorial Typography** (The Magazine Page in Motion, 1934 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Alexey Brodovitch's Harper's Bazaar spreads made the magazine page a choreographed space of didone headlines, white space and photography; Pentagram, Wallpaper* and The New York Times Magazine later carried that grid-bound restraint into covers and features that move.
- Study these reference works: Harper's Bazaar (Alexey Brodovitch, 1934 — 1958) · Vogue covers and mastheads (Didot lineage) · Wallpaper* (1996 —) · The New York Times Magazine animated covers (2010s —) · Pentagram editorial systems
- Motion DNA: Nothing bounces: rules draw, lines rise through masks and columns set one line at a time on long, decelerating eases, punctuated by a single page turn.
- Visual DNA: High-contrast didone display type, justified serif body, drop cap and pull quote in oxblood on warm paper, duotone photography held in a precise grid.
- Signature transitions: Grid reveal, masked headline rise, image-box open, page turn, pull-back to the closed issue.
- Key techniques: Six-column grid with hairline rules, Masked line-by-line justified setting, Procedural duotone photographs, Perspective page turn

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Six-column grid with hairline rules, Masked line-by-line justified setting, Procedural duotone photographs, Perspective page turn).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Six-column grid with hairline rules and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EDITORIAL TYPOGRAPHY", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, InDesign, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Editorial Typography motion-graphics film (The Magazine Page in Motion). Visual style: high-contrast didone display type, justified serif body, drop cap and pull quote in oxblood on warm paper, duotone photography held in a precise grid. Motion: nothing bounces: rules draw, lines rise through masks and columns set one line at a time on long, decelerating eases, punctuated by a single page turn. Signature moves: six-column grid with hairline rules, masked line-by-line justified setting, procedural duotone photographs, perspective page turn; transitions: grid reveal, masked headline rise, image-box open, page turn, pull-back to the closed issue. In the tradition of Harper's Bazaar (Alexey Brodovitch, 1934 — 1958) · Vogue covers and mastheads (Didot lineage) · Wallpaper* (1996 —) · The New York Times Magazine animated covers (2010s —) · Pentagram editorial systems. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EDITORIAL TYPOGRAPHY". Punchy sound design synced to every cut.
```
