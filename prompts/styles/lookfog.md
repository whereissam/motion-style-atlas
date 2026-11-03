# Depth Fog

*Distance falloff from the depth pass · 1980s — · Rendering Looks*

Reference film: `videos/lookfog.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Depth Fog** (Distance falloff from the depth pass, 1980s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Fog is the oldest depth cue in real-time graphics: the image is blended toward a fog colour by a function of distance, so far geometry fades into the backdrop instead of popping at the far clip plane. Flight simulators used it from the 1980s, and fixed-function OpenGL (1992) and Direct3D standardised three modes — linear, exponential and exponential-squared — computed per vertex or per pixel from eye depth. Height-dependent fog, which integrates a density that thins with altitude along the view ray, became common in game engines in the 2000s; modern engines extend it to volumetric fog that also scatters light.
- Study these reference works: Silent Hill (Konami, 1999; fog as atmosphere and draw-distance cover) · Turok: Dinosaur Hunter (Iguana Entertainment, 1997; distance fog on the Nintendo 64) · Limbo (Playdead, 2010; layered depth haze)
- Motion DNA: The camera makes the shared 50° orbit while the fog is dialled on the beat: a wipe brings exponential fog in over the plain render, the fog colour is detuned to a cool grey and back to show the horizon seam, the density rises, the falloff switches to exponential-squared, then to a height fog whose mist pools on the floor and slowly thickens as its falloff relaxes.
- Visual DNA: The Token, sphere and cube receding into warm paper haze; the floor dissolves into a backdrop of exactly the fog colour. Mono readouts give the mode, the formula, ρ, z0 and the two colour swatches; a depth-pass inset runs near white to far black; leader lines give each object its depth and fog fraction; the caption draws the live falloff curve.
- Signature transitions: Linear wipe against the plain render; crossfades between fog models
- Key techniques: Fog factor from the depth pass, Exp / exp² / height falloff, Fog colour = horizon colour

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Fog factor from the depth pass, Exp / exp² / height falloff, Fog colour = horizon colour).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Fog factor from the depth pass and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DEPTH FOG", held for about 1 s.

BUILD RULES
- Suggested tools: OpenGL / Direct3D fixed-function fog (GL_EXP, GL_EXP2), Engine height fog / deferred fog pass over the depth buffer, Canvas 2D + SDF tracer (js/look-kit.js): per-pixel fog factor from hit depth and the analytic height-fog integral along each ray. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Depth Fog motion-graphics film (Distance falloff from the depth pass). Visual style: the Token, sphere and cube receding into warm paper haze; the floor dissolves into a backdrop of exactly the fog colour. Mono readouts give the mode, the formula, ρ, z0 and the two colour swatches; a depth-pass inset runs near white to far black; leader lines give each object its depth and fog fraction; the caption draws the live falloff curve. Motion: the camera makes the shared 50° orbit while the fog is dialled on the beat: a wipe brings exponential fog in over the plain render, the fog colour is detuned to a cool grey and back to show the horizon seam, the density rises, the falloff switches to exponential-squared, then to a height fog whose mist pools on the floor and slowly thickens as its falloff relaxes. Signature moves: fog factor from the depth pass, exp / exp² / height falloff, fog colour = horizon colour; transitions: linear wipe against the plain render; crossfades between fog models. In the tradition of Silent Hill (Konami, 1999; fog as atmosphere and draw-distance cover) · Turok: Dinosaur Hunter (Iguana Entertainment, 1997; distance fog on the Nintendo 64) · Limbo (Playdead, 2010; layered depth haze). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DEPTH FOG". Punchy sound design synced to every cut.
```
