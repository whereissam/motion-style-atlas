# Noise Motion

*Perlin & curl-noise flow fields · 1985 — · Experimental & Generative*

Reference film: `videos/noisemotion.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Noise Motion** (Perlin & curl-noise flow fields, 1985 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Ken Perlin invented gradient noise for Tron and published it as "An Image Synthesizer" at SIGGRAPH 1985: a smooth, band-limited random function that became the default source of organic motion in computer graphics, earning him a Technical Achievement Academy Award in 1997. Generative artists turned it into motion by steering particles with it — angle-from-noise flow fields, and from 2007 Bridson's divergence-free curl noise — and Tyler Hobbs' Fidenza (2021) made packed, non-colliding flow-field curves a signature of long-form generative art.
- Study these reference works: Ken Perlin — "An Image Synthesizer", SIGGRAPH 1985 · Robert Bridson, Jim Hourihan & Marcus Nordenstam — "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007 · Robert Hodgin — Magnetosphere (iTunes visualizer, 2008) · Tyler Hobbs — Fidenza (Art Blocks, 2021)
- Motion DNA: Everything moves because a smooth random field says so: ticks swing into alignment, particles are born, stream along the field and die, the whole flow slowly morphs as the noise is sampled through time, then freezes while wide ribbons grow along it from their seed points.
- Visual DNA: A warm cream print with pen-plotter ink hairlines and topographic contours, then flat Fidenza-like ribbons of varied width in vermilion, ochre, ultramarine, blush and sage that never touch, finished with a mat margin and a gallery label.
- Signature transitions: Contour map to tick field, ticks release into particles, flow freezes, ribbons grow, pull back to the framed print
- Key techniques: Perlin gradient noise, Curl-noise advection, Collision-packed ribbons

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Perlin gradient noise, Curl-noise advection, Collision-packed ribbons).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Perlin gradient noise and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NOISE MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Processing / p5.js, openFrameworks / Cinder, TouchDesigner / Houdini, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Noise Motion motion-graphics film (Perlin & curl-noise flow fields). Visual style: a warm cream print with pen-plotter ink hairlines and topographic contours, then flat Fidenza-like ribbons of varied width in vermilion, ochre, ultramarine, blush and sage that never touch, finished with a mat margin and a gallery label. Motion: everything moves because a smooth random field says so: ticks swing into alignment, particles are born, stream along the field and die, the whole flow slowly morphs as the noise is sampled through time, then freezes while wide ribbons grow along it from their seed points. Signature moves: perlin gradient noise, curl-noise advection, collision-packed ribbons; transitions: contour map to tick field, ticks release into particles, flow freezes, ribbons grow, pull back to the framed print. In the tradition of Ken Perlin — "An Image Synthesizer", SIGGRAPH 1985 · Robert Bridson, Jim Hourihan & Marcus Nordenstam — "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007 · Robert Hodgin — Magnetosphere (iTunes visualizer, 2008) · Tyler Hobbs — Fidenza (Art Blocks, 2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NOISE MOTION". Punchy sound design synced to every cut.
```
