# Old-school Screensaver

*Moving Pixels vs. Burn-in · 1983 — 2000s · Digital, Internet & Screen*

Reference film: `videos/screensaver.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Old-school Screensaver** (Moving Pixels vs. Burn-in, 1983 — 2000s; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Static images burned permanently into always-on CRT phosphor, so John Socha published SCRNSAVE for the IBM PC in 1983 to blank the screen. Berkeley Systems’ After Dark (1989) turned the idle screen into entertainment, Windows 3.1 (1992) made Starfield Simulation and Mystify universal, and the OpenGL savers of Windows NT 3.5 (1994) added 3D Pipes. The DVD player’s bouncing idle logo later became a shared ritual of waiting for the perfect corner hit.
- Study these reference works: SCRNSAVE (John Socha, 1983) · After Dark & Flying Toasters (Berkeley Systems, 1989) · Windows 3.1 Starfield Simulation & Mystify (1992) · 3D Pipes, Windows NT 3.5 OpenGL savers (1994) · The Office, “Scott’s Tots” corner hit (NBC, 2009)
- Motion DNA: Endless, unattended motion: constant-velocity bounces, stars streaming from a vanishing point, pipes growing segment by segment until the tube is full — no cuts and no story, only loops waiting for a keypress, until the badge finally kisses the corner.
- Visual DNA: Saturated primaries on pure black: 1-pixel vector lines, flat-shaded OpenGL tubes and an italic wordmark at VGA resolution, seen through the curved glass, scanlines and bloom of a yellowing beige monitor in a dark office.
- Signature transitions: Saver hand-off with mode-switch blackout, screen-fill reset, corner-hit flash, badge homes to centre
- Key techniques: Perspective-divide starfield, Polygon echo trails, Painter-sorted 3D pipe growth, Bounce, recolour & corner hit

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Perspective-divide starfield, Polygon echo trails, Painter-sorted 3D pipe growth, Bounce, recolour & corner hit).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Perspective-divide starfield and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OLD-SCHOOL SCREENSAVER", held for about 1 s.

BUILD RULES
- Suggested tools: Win32 .scr (C), OpenGL 1.x, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Old-school Screensaver motion-graphics film (Moving Pixels vs. Burn-in). Visual style: saturated primaries on pure black: 1-pixel vector lines, flat-shaded OpenGL tubes and an italic wordmark at VGA resolution, seen through the curved glass, scanlines and bloom of a yellowing beige monitor in a dark office. Motion: endless, unattended motion: constant-velocity bounces, stars streaming from a vanishing point, pipes growing segment by segment until the tube is full — no cuts and no story, only loops waiting for a keypress, until the badge finally kisses the corner. Signature moves: perspective-divide starfield, polygon echo trails, painter-sorted 3d pipe growth, bounce, recolour & corner hit; transitions: saver hand-off with mode-switch blackout, screen-fill reset, corner-hit flash, badge homes to centre. In the tradition of SCRNSAVE (John Socha, 1983) · After Dark & Flying Toasters (Berkeley Systems, 1989) · Windows 3.1 Starfield Simulation & Mystify (1992) · 3D Pipes, Windows NT 3.5 OpenGL savers (1994) · The Office, “Scott’s Tots” corner hit (NBC, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OLD-SCHOOL SCREENSAVER". Punchy sound design synced to every cut.
```
