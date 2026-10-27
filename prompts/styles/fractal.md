# Fractal Motion

*Infinite Zoom · 1980 — · Experimental & Generative*

Reference film: `videos/fractal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Fractal Motion** (Infinite Zoom, 1980 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Benoit Mandelbrot imaged the set z ↦ z² + c at IBM in 1980 and made fractals a visual language with "The Fractal Geometry of Nature" (1982); smooth colouring and ever-deeper zooms turned its self-similar boundary into a genre of motion.
- Study these reference works: Benoit Mandelbrot, The Fractal Geometry of Nature (1982) · Peitgen & Richter, The Beauty of Fractals (1986) · Loren Carpenter, Vol Libre (1980) · Arthur C. Clarke, Fractals: The Colors of Infinity (1995) · Ultra Fractal (Frederik Slijkerman, 1999 —)
- Motion DNA: An exponential dolly: the camera divides its width by a constant factor every frame toward a fixed boundary point, so detail streams out of the centre forever while the palette flows through the bands.
- Visual DNA: Self-similar spirals and seahorse filaments in blue, white and molten gold, embossed by a raking light, with crisp black interior lakes.
- Signature transitions: Iteration-count reveal, infinite zoom, Mandelbrot-to-Julia parameter morph, exponential pull-back
- Key techniques: Escape-time iteration in float64, Smooth iteration count + palette cycling, Distance-estimate relief lighting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Escape-time iteration in float64, Smooth iteration count + palette cycling, Distance-estimate relief lighting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Escape-time iteration in float64 and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRACTAL MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL, Canvas 2D, Ultra Fractal, TouchDesigner. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Fractal Motion motion-graphics film (Infinite Zoom). Visual style: self-similar spirals and seahorse filaments in blue, white and molten gold, embossed by a raking light, with crisp black interior lakes. Motion: an exponential dolly: the camera divides its width by a constant factor every frame toward a fixed boundary point, so detail streams out of the centre forever while the palette flows through the bands. Signature moves: escape-time iteration in float64, smooth iteration count + palette cycling, distance-estimate relief lighting; transitions: iteration-count reveal, infinite zoom, Mandelbrot-to-Julia parameter morph, exponential pull-back. In the tradition of Benoit Mandelbrot, The Fractal Geometry of Nature (1982) · Peitgen & Richter, The Beauty of Fractals (1986) · Loren Carpenter, Vol Libre (1980) · Arthur C. Clarke, Fractals: The Colors of Infinity (1995) · Ultra Fractal (Frederik Slijkerman, 1999 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRACTAL MOTION". Punchy sound design synced to every cut.
```
