# Displacement

*A greyscale map pushes pixels from one picture into the next · 1990s — · Technique Atlas*

Reference film: `videos/techdisplace.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Displacement** (A greyscale map pushes pixels from one picture into the next, 1990s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A displacement map offsets each pixel of an image by the brightness of a second, greyscale image. Digital compositors used it for heat haze, refraction and ripples; After Effects shipped a Displacement Map effect, and motion designers turned it into a transition by animating the amount up and back down across a cut. Real-time versions became shader transitions, collected in the open-source GL Transitions library and the WebGL image sliders popular on agency sites.
- Study these reference works: After Effects Displacement Map effect (Adobe) · GL Transitions, open-source shader transition collection (Gaëtan Renaudeau and contributors) · WebGL hover and slider distortion effects on agency portfolio sites (2010s)
- Motion DNA: Three transitions, each 1.5 s, with a beat of hold between. The displacement amount rises from zero, peaks mid-transition at 120 px and falls back to zero, so both ends are clean; meanwhile the picture flips from A to B in the order the map dictates — noise in blotches, the gradient as a sweep from left to right, the ripple ring by ring.
- Visual DNA: The Technique Atlas stage with the Token in four states (orange, ink turned 90°, blue upside-down above MOTION, orange again); grid lines bend with the image; a greyscale inset of the current map with sampled offset arrows, a row of all three maps, a state label beneath the Token.
- Signature transitions: Noise-map displacement, gradient-map displacement, ripple-map displacement
- Key techniques: Luminance map → pixel offset, Amount swells and dies on a sine, Map-ordered switch from A to B

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Luminance map → pixel offset, Amount swells and dies on a sine, Map-ordered switch from A to B).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Luminance map → pixel offset and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DISPLACEMENT", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects Displacement Map / Turbulent Displace across a cut, GLSL transition shader: texture2D(from, uv + m·k·p), texture2D(to, uv − m·k·(1−p)), Canvas 2D: per-pixel offsets on a 480×320 offscreen buffer scaled into the frame. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Displacement motion-graphics film (A greyscale map pushes pixels from one picture into the next). Visual style: the Technique Atlas stage with the Token in four states (orange, ink turned 90°, blue upside-down above MOTION, orange again); grid lines bend with the image; a greyscale inset of the current map with sampled offset arrows, a row of all three maps, a state label beneath the Token. Motion: three transitions, each 1.5 s, with a beat of hold between. The displacement amount rises from zero, peaks mid-transition at 120 px and falls back to zero, so both ends are clean; meanwhile the picture flips from A to B in the order the map dictates — noise in blotches, the gradient as a sweep from left to right, the ripple ring by ring. Signature moves: luminance map → pixel offset, amount swells and dies on a sine, map-ordered switch from a to b; transitions: noise-map displacement, gradient-map displacement, ripple-map displacement. In the tradition of After Effects Displacement Map effect (Adobe) · GL Transitions, open-source shader transition collection (Gaëtan Renaudeau and contributors) · WebGL hover and slider distortion effects on agency portfolio sites (2010s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DISPLACEMENT". Punchy sound design synced to every cut.
```
