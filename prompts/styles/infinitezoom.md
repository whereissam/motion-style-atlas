# Infinite Zoom

*Every picture holds the next · 1968 — · Experimental & Generative*

Reference film: `videos/infinitezoom.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Infinite Zoom** (Every picture holds the next, 1968 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The infinite zoom is a single unbroken push into an image in which every scene turns out to contain the next, so the camera can travel forever at a constant exponential rate. Charles and Ray Eames fixed its grammar in Powers of Ten (1977, after a 1968 sketch), pulling away from a Chicago picnic by a factor of ten every ten seconds; the Droste effect and Escher's Print Gallery (1956) supplied the recursion, fractal explorers the endless dive, and the online Zoom Quilt (2004) made it a collaborative loop of hand-painted scenes.
- Study these reference works: Charles and Ray Eames — Powers of Ten (1977) · M. C. Escher — Print Gallery (1956) · Istvan Banyai — Zoom (picture book, 1995) · Nikolaus Hafermaas et al. — The Zoom Quilt (2004)
- Motion DNA: One continuous push at constant log speed: the field shrinks by a factor of five every two seconds about each portal's fixed point, with a slight roll as each tilted portal straightens, and after five scenes the picture is back where it began — the film loops without a cut.
- Visual DNA: Warm, legible illustration in five idioms — aerial park map, glossy magazine photo, lamplit cabin interior, painterly night city, retro desktop UI — linked by the Powers-of-Ten target square and a white HUD of level and magnification.
- Signature transitions: None: each portal grows to fill the frame and becomes the next scene; the last scene's photo is the first scene
- Key techniques: Nested scene recursion, Exponential camera scale, Fixed-point portal maps

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Nested scene recursion, Exponential camera scale, Fixed-point portal maps).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Nested scene recursion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INFINITE ZOOM", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects nested comps / Photoshop zoom layers, Stable Diffusion outpainting zooms, Shaders (log-polar Droste), Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Infinite Zoom motion-graphics film (Every picture holds the next). Visual style: warm, legible illustration in five idioms — aerial park map, glossy magazine photo, lamplit cabin interior, painterly night city, retro desktop UI — linked by the Powers-of-Ten target square and a white HUD of level and magnification. Motion: one continuous push at constant log speed: the field shrinks by a factor of five every two seconds about each portal's fixed point, with a slight roll as each tilted portal straightens, and after five scenes the picture is back where it began — the film loops without a cut. Signature moves: nested scene recursion, exponential camera scale, fixed-point portal maps; transitions: none: each portal grows to fill the frame and becomes the next scene; the last scene's photo is the first scene. In the tradition of Charles and Ray Eames — Powers of Ten (1977) · M. C. Escher — Print Gallery (1956) · Istvan Banyai — Zoom (picture book, 1995) · Nikolaus Hafermaas et al. — The Zoom Quilt (2004). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INFINITE ZOOM". Punchy sound design synced to every cut.
```
