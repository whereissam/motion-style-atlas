# Normals

*Surface direction stored as colour, then relit · 1978 — · Rendering Looks*

Reference film: `videos/looknormals.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Normals** (Surface direction stored as colour, then relit, 1978 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Storing a surface direction per pixel goes back to James Blinn’s bump mapping (“Simulation of Wrinkled Surfaces”, SIGGRAPH 1978), which perturbs the normal used for lighting without changing the geometry. Normal maps — the perturbed normal itself, written as rgb = n·0.5 + 0.5 — followed in the late 1990s, baked from detailed models onto simple ones, and tangent space made them reusable on any surface; Doom 3 (2004) put them in front of millions of players. Deferred shading (Deering et al., 1988; the “G-buffer” of Saito and Takahashi, 1990) writes normals, position and albedo to buffers first and lights them afterwards, which is also how compositors relight a render from its normal pass.
- Study these reference works: Doom 3 (id Software, 2004; normal-mapped characters and walls) · Half-Life 2 (Valve, 2004; radiosity normal mapping) · Killzone 2 (Guerrilla Games, 2009; deferred shading from a G-buffer)
- Motion DNA: The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. A wipe replaces the plain render with world-space normals, whose colours stay fixed to the scene as the camera moves; a second wipe switches to view-space normals, which follow the camera; normal-map detail fades in on the floor and cube; a last wipe relights the frame from the passes while a point light circles the still life.
- Visual DNA: Pastel red-green-blue surfaces on black: a green floor, a sphere carrying every direction, the lavender of camera-facing faces; bevelled tiles and dimples appear in the colours only. Then a dark studio lit by one warm moving light and a cool rim, the tile bevels and dimples catching it. Legend sphere with axis arrows, a live probe on the Token, ink leader labels, small G-buffer insets.
- Signature transitions: Wipe from plain to world normals, to view normals, to the deferred relight; normal-map detail cross-fades in
- Key techniques: rgb = n·0.5 + 0.5, world vs view space, Tangent-space normal map, Deferred relight from N, P and albedo

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (rgb = n·0.5 + 0.5, world vs view space, Tangent-space normal map, Deferred relight from N, P and albedo).
- 5.0–8.0 s  Climax: the most spectacular moment, built on rgb = n·0.5 + 0.5, world vs view space and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "NORMALS", held for about 1 s.

BUILD RULES
- Suggested tools: Normal AOVs (world or camera space) in Arnold, V-Ray, Blender; the Relight node in Nuke, Tangent-space normal maps baked from high-poly sculpts, Canvas 2D + SDF tracer (js/look-kit.js): G-buffer normals encoded per pixel, procedural height-field slopes as the normal map, N·L + Blinn relight from the stored position and albedo. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Normals motion-graphics film (Surface direction stored as colour, then relit). Visual style: pastel red-green-blue surfaces on black: a green floor, a sphere carrying every direction, the lavender of camera-facing faces; bevelled tiles and dimples appear in the colours only. Then a dark studio lit by one warm moving light and a cool rim, the tile bevels and dimples catching it. Legend sphere with axis arrows, a live probe on the Token, ink leader labels, small G-buffer insets. Motion: the shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. A wipe replaces the plain render with world-space normals, whose colours stay fixed to the scene as the camera moves; a second wipe switches to view-space normals, which follow the camera; normal-map detail fades in on the floor and cube; a last wipe relights the frame from the passes while a point light circles the still life. Signature moves: rgb = n·0.5 + 0.5, world vs view space, tangent-space normal map, deferred relight from n, p and albedo; transitions: wipe from plain to world normals, to view normals, to the deferred relight; normal-map detail cross-fades in. In the tradition of Doom 3 (id Software, 2004; normal-mapped characters and walls) · Half-Life 2 (Valve, 2004; radiosity normal mapping) · Killzone 2 (Guerrilla Games, 2009; deferred shading from a G-buffer). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "NORMALS". Punchy sound design synced to every cut.
```
