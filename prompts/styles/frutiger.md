# Frutiger Aero

*Glossy Clean-tech Optimism · 2004 — 2013 · Digital, Internet & Screen*

Reference film: `videos/frutiger.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Frutiger Aero** (Glossy Clean-tech Optimism, 2004 — 2013; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A retroactively named mid-2000s look (the label spread in the late 2010s via the Consumer Aesthetics Research Institute) of glossy glass UI, aqua bubbles and green nature imagery, epitomised by Windows Vista’s Aero and early skeuomorphic iPhone OS.
- Study these reference works: Windows Vista Aero (2007) · Windows 7 (2009) · Mac OS X Aqua (2000) · iPhone OS 1–6 (2007–2012) · Nintendo Wii Menu (2006)
- Motion DNA: Buoyant, floating motion: rising bubbles, springy UI pops, gentle drifting light and slow camera lifts.
- Visual DNA: Sky-blue and lime gradients, wet glass with specular caps, aqua water and fish, rolling green hills, aurora swooshes and lens flares.
- Signature transitions: Underwater rise, water-surface breach, glass slide-in, bubble converge, shrink-fade, shine sweep
- Key techniques: Glossy half-pill highlights, Glass orbs, bubbles & water, Sky, grass hills & lens flares

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Glossy half-pill highlights, Glass orbs, bubbles & water, Sky, grass hills & lens flares).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Glossy half-pill highlights and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRUTIGER AERO", held for about 1 s.

BUILD RULES
- Suggested tools: Photoshop / Illustrator, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Frutiger Aero motion-graphics film (Glossy Clean-tech Optimism). Visual style: sky-blue and lime gradients, wet glass with specular caps, aqua water and fish, rolling green hills, aurora swooshes and lens flares. Motion: buoyant, floating motion: rising bubbles, springy UI pops, gentle drifting light and slow camera lifts. Signature moves: glossy half-pill highlights, glass orbs, bubbles & water, sky, grass hills & lens flares; transitions: underwater rise, water-surface breach, glass slide-in, bubble converge, shrink-fade, shine sweep. In the tradition of Windows Vista Aero (2007) · Windows 7 (2009) · Mac OS X Aqua (2000) · iPhone OS 1–6 (2007–2012) · Nintendo Wii Menu (2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRUTIGER AERO". Punchy sound design synced to every cut.
```
