# Photoreal CGI

*Light, Simulated · 1993 — · 3D & CGI Motion*

Reference film: `videos/photoreal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Photoreal CGI** (Light, Simulated, 1993 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Computer imagery made to be mistaken for photography: physically based materials lit by simulated light, with global illumination, soft shadows, depth of field and motion blur from a virtual camera. ILM’s T. rex in Jurassic Park (1993) made it a blockbuster tool, Pixar’s RenderMan rendered a generation of effects films, and path tracers (Arnold, RenderMan RIS, Cycles) made physically correct light the default in the 2010s; Alex Roman’s The Third & The Seventh (2009) showed one artist could make architecture indistinguishable from film.
- Study these reference works: The Road to Point Reyes (Lucasfilm Computer Division, 1983) · Jurassic Park (Steven Spielberg; ILM, 1993) · RenderMan (Pixar, 1988 —) · The Third & The Seventh (Alex Roman, 2009) · Gravity (Alfonso Cuarón; Framestore, 2013)
- Motion DNA: The camera behaves like a real one: a slow dolly and a measured focus pull, a 180°-ish shutter that smears only what moves, nothing faster than physics allows; the reveal is the render itself — buckets spiralling out, then noise resolving into light as samples double.
- Visual DNA: A quiet still life under a window: a hard window-shaped sun patch with muntin shadows on oak, soft skylight, warm bounce light bleeding up the wall, a chrome sphere mirroring the room, glazed and terracotta ceramics with Fresnel sheen, filmic tonemapping, shallow depth of field, bloom, vignette and grain, scope letterbox.
- Signature transitions: Render-view to film: the HUD and bucket brackets fade as the image converges, scope bars slide in and the shot starts to move
- Key techniques: Ray-traced soft shadows + one-bounce GI, Bucket and progressive render passes, Depth of field + motion blur

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ray-traced soft shadows + one-bounce GI, Bucket and progressive render passes, Depth of field + motion blur).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ray-traced soft shadows + one-bounce GI and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PHOTOREAL CGI", held for about 1 s.

BUILD RULES
- Suggested tools: Pixar RenderMan / Arnold / V-Ray / Cycles path tracing with PBR shaders, Compositing in Nuke: lens distortion, DOF, motion blur, grain matching, Canvas 2D: a 640×360 ray tracer (analytic sphere and cylinder hits, window-masked sun, soft occlusion, chrome and clear-coat reflection rays, ACES tonemap) upscaled, with depth-blended blur for DOF and stochastic shutter samples for motion blur. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Photoreal CGI motion-graphics film (Light, Simulated). Visual style: a quiet still life under a window: a hard window-shaped sun patch with muntin shadows on oak, soft skylight, warm bounce light bleeding up the wall, a chrome sphere mirroring the room, glazed and terracotta ceramics with Fresnel sheen, filmic tonemapping, shallow depth of field, bloom, vignette and grain, scope letterbox. Motion: the camera behaves like a real one: a slow dolly and a measured focus pull, a 180°-ish shutter that smears only what moves, nothing faster than physics allows; the reveal is the render itself — buckets spiralling out, then noise resolving into light as samples double. Signature moves: ray-traced soft shadows + one-bounce gi, bucket and progressive render passes, depth of field + motion blur; transitions: render-view to film: the HUD and bucket brackets fade as the image converges, scope bars slide in and the shot starts to move. In the tradition of The Road to Point Reyes (Lucasfilm Computer Division, 1983) · Jurassic Park (Steven Spielberg; ILM, 1993) · RenderMan (Pixar, 1988 —) · The Third & The Seventh (Alex Roman, 2009) · Gravity (Alfonso Cuarón; Framestore, 2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PHOTOREAL CGI". Punchy sound design synced to every cut.
```
