# Wireframe

*Edges only, hidden lines removed · 1963 — · Rendering Looks*

Reference film: `videos/lookwire.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Wireframe** (Edges only, hidden lines removed, 1963 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Computer graphics began as lines: Ivan Sutherland’s Sketchpad (1963) drew on a vector display, and Lawrence Roberts’s 1963 MIT thesis gave one of the first methods for removing the lines a solid would hide. Arthur Appel at IBM followed in 1967 with quantitative invisibility. Vector arcade games and early film graphics made the wireframe a look in its own right, and it remains the modelling view of every 3D package.
- Study these reference works: Star Wars (George Lucas, 1977; Larry Cuba’s Death Star briefing animation) · Battlezone (Atari, 1980; vector wireframe arcade game) · Elite (David Braben and Ian Bell, Acornsoft, 1984; wireframe ships with hidden-line removal)
- Motion DNA: A wipe turns the plain render into ink wires on paper; the camera makes the shared orbit while the hidden-line test switches every two beats: off (every line, front and back, a tangle), on (hidden lines removed), dashed (hidden lines shown faint). The shaded render then fades in under the wires, and the test flips to dashed and back once more near the end.
- Visual DNA: Warm paper with near-white solids; ink silhouette circle, latitude and longitude rings on the sphere, a 4 × 4 grid on each face of the cube in blue, and orange contour loops, cross profiles and a face grid on the Token; a floor grid fading into the backdrop. Over the shaded render the Token and cube wires turn light.
- Signature transitions: A vertical wipe from plain to wire; hidden-line toggles on the beat; a crossfade to wire over shaded
- Key techniques: Analytic wire geometry, projected, Hidden-line removal by depth test, Wire over shaded

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic wire geometry, projected, Hidden-line removal by depth test, Wire over shaded).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic wire geometry, projected and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WIREFRAME", held for about 1 s.

BUILD RULES
- Suggested tools: Wireframe / hidden-line render modes in DCC viewports (Maya, Blender, Cinema 4D), Barycentric or geometry-shader wireframe over shaded meshes in game engines, Canvas 2D + SDF tracer (js/look-kit.js): analytic polylines through LK.project, each point kept if its eye distance ≤ G-buffer depth + ε. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Wireframe motion-graphics film (Edges only, hidden lines removed). Visual style: warm paper with near-white solids; ink silhouette circle, latitude and longitude rings on the sphere, a 4 × 4 grid on each face of the cube in blue, and orange contour loops, cross profiles and a face grid on the Token; a floor grid fading into the backdrop. Over the shaded render the Token and cube wires turn light. Motion: a wipe turns the plain render into ink wires on paper; the camera makes the shared orbit while the hidden-line test switches every two beats: off (every line, front and back, a tangle), on (hidden lines removed), dashed (hidden lines shown faint). The shaded render then fades in under the wires, and the test flips to dashed and back once more near the end. Signature moves: analytic wire geometry, projected, hidden-line removal by depth test, wire over shaded; transitions: a vertical wipe from plain to wire; hidden-line toggles on the beat; a crossfade to wire over shaded. In the tradition of Star Wars (George Lucas, 1977; Larry Cuba’s Death Star briefing animation) · Battlezone (Atari, 1980; vector wireframe arcade game) · Elite (David Braben and Ian Bell, Acornsoft, 1984; wireframe ships with hidden-line removal). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WIREFRAME". Punchy sound design synced to every cut.
```
