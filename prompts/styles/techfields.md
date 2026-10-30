# Fields

*Falloffs that drive attributes by distance · 2006 — · Technique Atlas*

Reference film: `videos/techfields.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Fields** (Falloffs that drive attributes by distance, 2006 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A field assigns a value to every point in space, and each object samples it to set its own scale, rotation or colour, so one gizmo can art-direct thousands of copies at once. Cinema 4D’s MoGraph effectors (2006) popularised spherical and linear falloffs for motion design; Release 20 (2018) generalised them into layered Fields, and Houdini and Blender offer the same idea as attribute falloffs and field nodes.
- Study these reference works: MoGraph effectors with falloff (Cinema 4D, Maxon, 2006) · Fields (Cinema 4D Release 20, 2018) · Geometry Nodes fields (Blender, 2021)
- Motion DNA: Nothing moves on its own: the Tokens are fixed in a grid and only react. A gizmo glides over them and they swell, turn and warm up as it passes, then settle behind it; a plane sweeps across and tips every row in turn; noise makes them breathe in drifting patches. Every change in the field crossfades on the bar.
- Visual DNA: A dense grid of Tokens running from small upright grey to large, half-turned orange; underneath, a faint orange heat map of the field, dashed radius rings and crosshair for the sphere, a ramp band and arrow for the plane; a small falloff-profile graph and mono labels in the HUD.
- Signature transitions: Crossfades between field types on the bar line, resolving to a static centred spherical falloff
- Key techniques: Spherical / linear / noise falloff, Field → scale, rotation, colour, Heat-map visualisation

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Spherical / linear / noise falloff, Field → scale, rotation, colour, Heat-map visualisation).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Spherical / linear / noise falloff and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FIELDS", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D MoGraph effectors and Fields, Houdini attribute falloff / Blender Geometry Nodes fields, Canvas 2D: field sampled per Token plus a low-res heat map upscaled underneath. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Fields motion-graphics film (Falloffs that drive attributes by distance). Visual style: a dense grid of Tokens running from small upright grey to large, half-turned orange; underneath, a faint orange heat map of the field, dashed radius rings and crosshair for the sphere, a ramp band and arrow for the plane; a small falloff-profile graph and mono labels in the HUD. Motion: nothing moves on its own: the Tokens are fixed in a grid and only react. A gizmo glides over them and they swell, turn and warm up as it passes, then settle behind it; a plane sweeps across and tips every row in turn; noise makes them breathe in drifting patches. Every change in the field crossfades on the bar. Signature moves: spherical / linear / noise falloff, field → scale, rotation, colour, heat-map visualisation; transitions: crossfades between field types on the bar line, resolving to a static centred spherical falloff. In the tradition of MoGraph effectors with falloff (Cinema 4D, Maxon, 2006) · Fields (Cinema 4D Release 20, 2018) · Geometry Nodes fields (Blender, 2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FIELDS". Punchy sound design synced to every cut.
```
