# Architectural Motion

*Plan, Massing and Flythrough · 1990s — · 3D & CGI Motion*

Reference film: `videos/architectural.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Architectural Motion** (Plan, Massing and Flythrough, 1990s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Archviz animation turns an unbuilt design into a camera journey: drawings become volumes, volumes take on materials and daylight, and a dolly or drone path walks the client through spaces that do not exist yet. It grew from 1990s 3ds Max and V-Ray walkthroughs for competitions and real-estate marketing; Alex Roman’s The Third & The Seventh (2009) showed it could be cinema, and real-time engines (Lumion, Twinmotion, Unreal) later made sun studies and flythroughs part of everyday design review.
- Study these reference works: The Third & The Seventh (Alex Roman, 2009) · Lumion (Act-3D, 2010) · Twinmotion (Abvent, later Epic Games) · Unreal Engine archviz walkthroughs
- Motion DNA: Slow, steady, physically plausible camera: a top-down plan that tilts into perspective, a measured orbit while the sun arcs overhead, then a gimbal-smooth drop to eye level and a lateral dolly — no shake, no snap, every move eased like a crane or drone.
- Visual DNA: Blueprint blue with white hairlines, dash-dot grids and poché walls; a white clay massing model with soft contact shadows; then honest materials — travertine, board-formed concrete, timber and glass — under a sky that moves from crisp noon to warm dusk with glowing interiors mirrored in a pool.
- Signature transitions: Line draw-on, plan-to-perspective tilt, extrusion, wireframe-to-solid crossfade, material wipe, sun sweep, eye-level dolly
- Key techniques: Blueprint plan extruded to massing, Exact cast shadows on box faces, Sun study sweep + dusk glow

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Blueprint plan extruded to massing, Exact cast shadows on box faces, Sun study sweep + dusk glow).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Blueprint plan extruded to massing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ARCHITECTURAL MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: 3ds Max + V-Ray / Corona, Lumion, Twinmotion, Unreal Engine, Revit / Rhino / SketchUp source models, Canvas 2D: AABB painter sort, cast-shadow hulls per face plane, mirrored-camera pool reflection. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Architectural Motion motion-graphics film (Plan, Massing and Flythrough). Visual style: blueprint blue with white hairlines, dash-dot grids and poché walls; a white clay massing model with soft contact shadows; then honest materials — travertine, board-formed concrete, timber and glass — under a sky that moves from crisp noon to warm dusk with glowing interiors mirrored in a pool. Motion: slow, steady, physically plausible camera: a top-down plan that tilts into perspective, a measured orbit while the sun arcs overhead, then a gimbal-smooth drop to eye level and a lateral dolly — no shake, no snap, every move eased like a crane or drone. Signature moves: blueprint plan extruded to massing, exact cast shadows on box faces, sun study sweep + dusk glow; transitions: line draw-on, plan-to-perspective tilt, extrusion, wireframe-to-solid crossfade, material wipe, sun sweep, eye-level dolly. In the tradition of The Third & The Seventh (Alex Roman, 2009) · Lumion (Act-3D, 2010) · Twinmotion (Abvent, later Epic Games) · Unreal Engine archviz walkthroughs. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ARCHITECTURAL MOTION". Punchy sound design synced to every cut.
```
