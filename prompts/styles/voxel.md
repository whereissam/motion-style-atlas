# Voxel Motion

*Volumetric Pixels · 2009 — · 3D & CGI Motion*

Reference film: `videos/voxel.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Voxel Motion** (Volumetric Pixels, 2009 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Voxels — volumetric pixels — came from medical imaging and 1990s voxel engines (Comanche, Outcast); Minecraft (2009) made the cube a mass aesthetic and MagicaVoxel (2013) gave motion designers a free, toy-like voxel studio with soft AO renders.
- Study these reference works: Comanche (NovaLogic, 1992) · Minecraft (Mojang, 2009) · MagicaVoxel (ephtracy, 2013) · Crossy Road (Hipster Whale, 2014) · Teardown (Tuxedo Labs, 2022)
- Motion DNA: Block-by-block construction layer after layer, a tiny character hop-walk, then a blast that freezes in bullet-time and rewinds into place.
- Visual DNA: Unit cubes with crisp edges, soft AO in creases, toy-like saturated palette, floating island diorama.
- Signature transitions: Layer build-up, block pop-in, explosion scatter, undo rewind.
- Key techniques: Orthographic camera orbit + painter’s sort, Face culling on an occupancy grid, Edge-based ambient occlusion per face

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Orthographic camera orbit + painter’s sort, Face culling on an occupancy grid, Edge-based ambient occlusion per face).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Orthographic camera orbit + painter’s sort and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VOXEL MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: MagicaVoxel, Blender (voxel remesh), Three.js InstancedMesh, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Voxel Motion motion-graphics film (Volumetric Pixels). Visual style: unit cubes with crisp edges, soft AO in creases, toy-like saturated palette, floating island diorama. Motion: block-by-block construction layer after layer, a tiny character hop-walk, then a blast that freezes in bullet-time and rewinds into place. Signature moves: orthographic camera orbit + painter’s sort, face culling on an occupancy grid, edge-based ambient occlusion per face; transitions: layer build-up, block pop-in, explosion scatter, undo rewind. In the tradition of Comanche (NovaLogic, 1992) · Minecraft (Mojang, 2009) · MagicaVoxel (ephtracy, 2013) · Crossy Road (Hipster Whale, 2014) · Teardown (Tuxedo Labs, 2022). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VOXEL MOTION". Punchy sound design synced to every cut.
```
