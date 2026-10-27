# Slit-scan

*Time Smeared into Space · 1968 — · Experimental & Generative*

Reference film: `videos/slitscan.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Slit-scan** (Time Smeared into Space, 1968 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A camera photographs artwork through a narrow moving slit during one long exposure per frame, so each part of the image records a different moment. John Whitney explored it in the early 1960s; Douglas Trumbull built a slit-scan machine for the Stargate sequence of Kubrick's 2001: A Space Odyssey (1968). Bernard Lodge used it for Doctor Who's 1973 time tunnel, and digital "time-slice" video revived it by giving every row or column of pixels its own timestamp.
- Study these reference works: 2001: A Space Odyssey — Stargate sequence (Douglas Trumbull, 1968) · Doctor Who title sequence (Bernard Lodge, 1973) · Star Trek: The Next Generation warp effect (1987) · Golan Levin, An Informal Catalogue of Slit-Scan Video Artworks (2005—) · Adam Magyar, Urban Flow (slit-scan photography, 2000s)
- Motion DNA: Relentless forward rush: streaks of light pour out of a dark horizon toward the camera on two planes, colour shifts in sudden waves, the planes rotate and fold into a spinning tunnel; then time itself is sliced column by column.
- Visual DNA: Saturated backlit colour streaks on black, compressed to a thin dark horizon and smeared toward the frame edges, with chromatic washes swapping from amber and magenta to cyan, violet, red and green.
- Signature transitions: Slit opening, plane rotation, corridor-to-tunnel fold, white-out flash, slit wipe (time-slice exposure)
- Key techniques: Moving slit + long exposure, Per-pixel depth mapping (z = f / d), Corridor-to-tunnel morph, Column time-slice

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Moving slit + long exposure, Per-pixel depth mapping (z = f / d), Corridor-to-tunnel morph, Column time-slice).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Moving slit + long exposure and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SLIT-SCAN", held for about 1 s.

BUILD RULES
- Suggested tools: Slit-scan rig on animation stand, After Effects Time Displacement, TouchDesigner, Canvas 2D (per-pixel ImageData). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Slit-scan motion-graphics film (Time Smeared into Space). Visual style: saturated backlit colour streaks on black, compressed to a thin dark horizon and smeared toward the frame edges, with chromatic washes swapping from amber and magenta to cyan, violet, red and green. Motion: relentless forward rush: streaks of light pour out of a dark horizon toward the camera on two planes, colour shifts in sudden waves, the planes rotate and fold into a spinning tunnel; then time itself is sliced column by column. Signature moves: moving slit + long exposure, per-pixel depth mapping (z = f / d), corridor-to-tunnel morph, column time-slice; transitions: slit opening, plane rotation, corridor-to-tunnel fold, white-out flash, slit wipe (time-slice exposure). In the tradition of 2001: A Space Odyssey — Stargate sequence (Douglas Trumbull, 1968) · Doctor Who title sequence (Bernard Lodge, 1973) · Star Trek: The Next Generation warp effect (1987) · Golan Levin, An Informal Catalogue of Slit-Scan Video Artworks (2005—) · Adam Magyar, Urban Flow (slit-scan photography, 2000s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SLIT-SCAN". Punchy sound design synced to every cut.
```
