# Pixel Art

*8-bit · 1980 — · Digital, Internet & Screen*

Reference film: `videos/pixel.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pixel Art** (8-bit, 1980 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born from the hardware limits of arcade and NES-era consoles, then kept alive as a deliberate aesthetic.
- Study these reference works: Super Mario Bros. (1985) · Celeste (2018)
- Motion DNA: Sprite cycles in few frames, parallax layers, motion snapped to whole pixels.
- Visual DNA: Low resolution scaled with nearest-neighbour, 16-colour palette, dithering, CRT mask.
- Signature transitions: Iris out, level-clear fanfare
- Key techniques: Low-res buffer, Limited palette, Chiptune sync

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Low-res buffer, Limited palette, Chiptune sync).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Low-res buffer and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PIXEL ART", held for about 1 s.

BUILD RULES
- Suggested tools: Aseprite, Canvas 2D, PICO-8. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pixel Art motion-graphics film (8-bit). Visual style: low resolution scaled with nearest-neighbour, 16-colour palette, dithering, CRT mask. Motion: sprite cycles in few frames, parallax layers, motion snapped to whole pixels. Signature moves: low-res buffer, limited palette, chiptune sync; transitions: iris out, level-clear fanfare. In the tradition of Super Mario Bros. (1985) · Celeste (2018). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PIXEL ART". Punchy sound design synced to every cut.
```
