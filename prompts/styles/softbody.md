# Soft Body Motion

*Jelly Physics · 2010s — · 3D & CGI Motion*

Reference film: `videos/softbody.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Soft Body Motion** (Jelly Physics, 2010s —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Grew out of cloth and soft-body solvers (Houdini Vellum, Cinema 4D Soft Body dynamics, Blender soft body) once they became fast enough for artists to loop; the squishy, glossy "oddly satisfying" jelly loop became a staple of Instagram and Behance motion reels in the late 2010s.
- Study these reference works: Andreas Wannerstedt — Oddly Satisfying loops (2017–) · SideFX Houdini Vellum launch demos (2018) · Tendril / ManvsMachine C4D soft-body reels · Cinema 4D R21 Soft Body showcases
- Motion DNA: Objects drop and hop on the beat, squash on contact, overshoot into stretch and wobble out on low-damped springs, so every landing reads as a satisfying rhythmic hit.
- Visual DNA: Glossy translucent candy colours, rounded bevels, soft studio key with coloured contact shadows on a seamless pastel set.
- Signature transitions: Drop-in, squash-and-stretch hits, sympathetic jiggle, letters landing as jelly.
- Key techniques: Analytic damped-spring squash, stretch and shear, Volume-preserving vertex deformation of rounded-box meshes, Wrap lighting + fresnel + transmitted colour shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Analytic damped-spring squash, stretch and shear, Volume-preserving vertex deformation of rounded-box meshes, Wrap lighting + fresnel + transmitted colour shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Analytic damped-spring squash, stretch and shear and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SOFT BODY MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Houdini Vellum, Cinema 4D Soft Body, Blender, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Soft Body Motion motion-graphics film (Jelly Physics). Visual style: glossy translucent candy colours, rounded bevels, soft studio key with coloured contact shadows on a seamless pastel set. Motion: objects drop and hop on the beat, squash on contact, overshoot into stretch and wobble out on low-damped springs, so every landing reads as a satisfying rhythmic hit. Signature moves: analytic damped-spring squash, stretch and shear, volume-preserving vertex deformation of rounded-box meshes, wrap lighting + fresnel + transmitted colour shadows; transitions: drop-in, squash-and-stretch hits, sympathetic jiggle, letters landing as jelly. In the tradition of Andreas Wannerstedt — Oddly Satisfying loops (2017–) · SideFX Houdini Vellum launch demos (2018) · Tendril / ManvsMachine C4D soft-body reels · Cinema 4D R21 Soft Body showcases. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SOFT BODY MOTION". Punchy sound design synced to every cut.
```
