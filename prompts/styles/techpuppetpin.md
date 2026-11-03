# Puppet Pins

*Pins on a triangle mesh; the shape bends as rigidly as it can · 2005 — · Technique Atlas*

Reference film: `videos/techpuppetpin.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Puppet Pins** (Pins on a triangle mesh; the shape bends as rigidly as it can, 2005 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Takeo Igarashi, Tomer Moscovich and John F. Hughes introduced As-Rigid-As-Possible Shape Manipulation at SIGGRAPH 2005: a 2D shape is triangulated, the user drags a few handles, and a least-squares solve keeps every triangle as close as possible to a rotated copy of itself, so the figure bends instead of shearing. Adobe brought the idea to motion designers as the Puppet tools of After Effects CS3 (2007) — Puppet Pin, Starch and Overlap — and to still images as Photoshop CS5’s Puppet Warp (2010). Olga Sorkine and Marc Alexa’s local/global ARAP solver (2007), used here, is the iteration most later tools follow.
- Study these reference works: As-Rigid-As-Possible Shape Manipulation (Igarashi, Moscovich & Hughes, SIGGRAPH 2005) · After Effects CS3 Puppet tool (Adobe, 2007) · Photoshop CS5 Puppet Warp (Adobe, 2010)
- Motion DNA: A mesh is laid over the Token in a second, three pins drop on the beat, and one pin is dragged left, right and up on the following beats: the Token leans and arches like a body while its corners and hole keep their shape. A rigid copy beside it cannot reach the pins; a linear blend reaches them but squeezes the hole. With the area around the hole starched, the same drag bends only the lower half. Finally the word MOTION, rigged as one strip, is arched and waved by three pins.
- Visual DNA: The Technique Atlas stage; the orange Token carried on a fine ink wireframe, black pins with yellow centres (the dragged one ringed in orange), dashed drag lines from rest to target, a translucent blue starch patch; two small comparison thumbnails at the right with red pin-error lines; mono phase labels top left.
- Signature transitions: Triangulate, pin, drag, starch, then a cross-fade from the Token mesh to the word mesh
- Key techniques: Triangle mesh over the layer, expanded past its outline, Local/global ARAP: best rotation per vertex, then one linear solve, Starch: heavier edge weights in a painted region

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Triangle mesh over the layer, expanded past its outline, Local/global ARAP: best rotation per vertex, then one linear solve, Starch: heavier edge weights in a painted region).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Triangle mesh over the layer, expanded past its outline and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PUPPET PINS", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects Puppet Pin / Starch tools (mesh expansion, triangle count), Sorkine–Alexa local/global ARAP precomputed in setup: dense Cholesky of the pinned Laplacian, 12 warm-started iterations per frame, Canvas 2D: affine texture-mapped triangles, wireframe and pin overlay. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Puppet Pins motion-graphics film (Pins on a triangle mesh; the shape bends as rigidly as it can). Visual style: the Technique Atlas stage; the orange Token carried on a fine ink wireframe, black pins with yellow centres (the dragged one ringed in orange), dashed drag lines from rest to target, a translucent blue starch patch; two small comparison thumbnails at the right with red pin-error lines; mono phase labels top left. Motion: a mesh is laid over the Token in a second, three pins drop on the beat, and one pin is dragged left, right and up on the following beats: the Token leans and arches like a body while its corners and hole keep their shape. A rigid copy beside it cannot reach the pins; a linear blend reaches them but squeezes the hole. With the area around the hole starched, the same drag bends only the lower half. Finally the word MOTION, rigged as one strip, is arched and waved by three pins. Signature moves: triangle mesh over the layer, expanded past its outline, local/global arap: best rotation per vertex, then one linear solve, starch: heavier edge weights in a painted region; transitions: triangulate, pin, drag, starch, then a cross-fade from the Token mesh to the word mesh. In the tradition of As-Rigid-As-Possible Shape Manipulation (Igarashi, Moscovich & Hughes, SIGGRAPH 2005) · After Effects CS3 Puppet tool (Adobe, 2007) · Photoshop CS5 Puppet Warp (Adobe, 2010). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PUPPET PINS". Punchy sound design synced to every cut.
```
