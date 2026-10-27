# CRT Terminal / Digital Rain

*Green Phosphor Code · 1999 — · Digital, Internet & Screen*

Reference film: `videos/terminal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **CRT Terminal / Digital Rain** (Green Phosphor Code, 1999 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Green P1-phosphor monochrome terminals defined early computing screens; The Matrix (1999) turned them into myth with its cascading “digital rain” of mirrored katakana and numerals, designed by Simon Whiteley.
- Study these reference works: The Matrix (1999) title & code rain · WarGames (1983) · Alien (1979) MU-TH-UR screens · IBM 5151 monochrome display (1981)
- Motion DNA: Discrete, character-by-character time: typing, ticking bars, then cascades of falling glyphs that resolve into meaning.
- Visual DNA: Monochrome green phosphor on black with bloom, scanlines, barrel-curved glass and vignette; mirrored half-width katakana columns with white-hot heads.
- Signature transitions: CRT power-on, character scramble-and-fall, rain sweep reveal, glyph lock
- Key techniques: Typed command lines & block cursor, ASCII progress bars, Katakana rain, phosphor bloom, curved glass

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Typed command lines & block cursor, ASCII progress bars, Katakana rain, phosphor bloom, curved glass).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Typed command lines & block cursor and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CRT TERMINAL / DIGITAL RAIN", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, GLSL shaders. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second CRT Terminal / Digital Rain motion-graphics film (Green Phosphor Code). Visual style: monochrome green phosphor on black with bloom, scanlines, barrel-curved glass and vignette; mirrored half-width katakana columns with white-hot heads. Motion: discrete, character-by-character time: typing, ticking bars, then cascades of falling glyphs that resolve into meaning. Signature moves: typed command lines & block cursor, ascii progress bars, katakana rain, phosphor bloom, curved glass; transitions: cRT power-on, character scramble-and-fall, rain sweep reveal, glyph lock. In the tradition of The Matrix (1999) title & code rain · WarGames (1983) · Alien (1979) MU-TH-UR screens · IBM 5151 monochrome display (1981). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CRT TERMINAL / DIGITAL RAIN". Punchy sound design synced to every cut.
```
