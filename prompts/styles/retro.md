# Retrowave Chrome

*80s Neon & CGI · 1982 — · Digital, Internet & Screen*

Reference film: `videos/retro.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Retrowave Chrome** (80s Neon & CGI, 1982 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Early CGI and MTV-era idents, revived in the 2010s alongside synthwave music.
- Study these reference works: Tron (1982) · Drive (2011) · Stranger Things titles (2016)
- Motion DNA: An infinite grid scrolls toward camera while neon letters slide slowly together in extreme close-up.
- Visual DNA: Magenta and cyan, striped sunset, chrome type, VHS scanlines.
- Signature transitions: VHS tracking band, white flash to chrome
- Key techniques: Perspective grid, Chrome gradients, Neon glow

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Perspective grid, Chrome gradients, Neon glow).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Perspective grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RETROWAVE CHROME", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Cinema 4D, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Retrowave Chrome motion-graphics film (80s Neon & CGI). Visual style: magenta and cyan, striped sunset, chrome type, VHS scanlines. Motion: an infinite grid scrolls toward camera while neon letters slide slowly together in extreme close-up. Signature moves: perspective grid, chrome gradients, neon glow; transitions: vHS tracking band, white flash to chrome. In the tradition of Tron (1982) · Drive (2011) · Stranger Things titles (2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RETROWAVE CHROME". Punchy sound design synced to every cut.
```
