# Typewriter Animation

*Slug-Struck Type · 1874 — · Typography & Text Motion*

Reference film: `videos/typewriter.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Typewriter Animation** (Slug-Struck Type, 1874 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The Sholes & Glidden "Type-Writer", sold by Remington from 1874, fixed the QWERTY layout and the look of monospaced slug-struck type; the Underwood No. 5 (1900) made front-strike visible writing the office standard. Film and television borrowed its rhythm for typed-on titles and location supers, and After Effects ships a "Typewriter" text preset that reveals one character at a time.
- Study these reference works: Sholes & Glidden Type-Writer (Remington, 1874) · Underwood No. 5 (1900) · Leroy Anderson, "The Typewriter" (1950) · Naked Lunch (David Cronenberg, 1991) · Atonement (Joe Wright, 2007; typewriter in Dario Marianelli’s score)
- Motion DNA: Time is quantised into keystrokes: each letter lands with a hard impact while the carriage steps one pitch left; a bell warns of the margin, the return lever throws the page back and ratchets a line, and mistakes are x-ed out instead of erased.
- Visual DNA: Monospaced slab-serif slugs pressed unevenly into off-white bond — heavy where the bar hit hard, broken where the ribbon ran dry, each letter a hair off the baseline — in black or red ribbon, framed by chrome and black enamel.
- Signature transitions: Carriage-return whip, line feed, pull-back reveal, macro dive into a single glyph, typed-on title card
- Key techniques: Per-keystroke timing with human jitter, Carriage escapement, bell & return, Uneven ribbon ink, misaligned slugs, Bichrome black/red ribbon

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-keystroke timing with human jitter, Carriage escapement, bell & return, Uneven ribbon ink, misaligned slugs, Bichrome black/red ribbon).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-keystroke timing with human jitter and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TYPEWRITER ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (Typewriter text preset), Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Typewriter Animation motion-graphics film (Slug-Struck Type). Visual style: monospaced slab-serif slugs pressed unevenly into off-white bond — heavy where the bar hit hard, broken where the ribbon ran dry, each letter a hair off the baseline — in black or red ribbon, framed by chrome and black enamel. Motion: time is quantised into keystrokes: each letter lands with a hard impact while the carriage steps one pitch left; a bell warns of the margin, the return lever throws the page back and ratchets a line, and mistakes are x-ed out instead of erased. Signature moves: per-keystroke timing with human jitter, carriage escapement, bell & return, uneven ribbon ink, misaligned slugs, bichrome black/red ribbon; transitions: carriage-return whip, line feed, pull-back reveal, macro dive into a single glyph, typed-on title card. In the tradition of Sholes & Glidden Type-Writer (Remington, 1874) · Underwood No. 5 (1900) · Leroy Anderson, "The Typewriter" (1950) · Naked Lunch (David Cronenberg, 1991) · Atonement (Joe Wright, 2007; typewriter in Dario Marianelli’s score). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TYPEWRITER ANIMATION". Punchy sound design synced to every cut.
```
