# Raymarching

*Signed Distance Fields · 1989 — / 2008 — · Experimental & Generative*

Reference film: `videos/raymarch.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Raymarching** (Signed Distance Fields, 1989 — / 2008 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Instead of polygons, the scene is a single function returning the distance to the nearest surface; each pixel's ray steps forward by that distance until it touches something (John C. Hart's "sphere tracing", 1989/1996). The 4k-intro demoscene adopted it around 2008 (Iñigo Quilez's "Rendering Worlds with Two Triangles", Function 2008) and Shadertoy (Quilez & Pol Jeremias, 2013) made smooth-min blobs, soft shadows, AO and infinite repetition a shared visual language.
- Study these reference works: Iñigo Quilez / RGBA — Elevated (4k intro, Breakpoint 2009) · Iñigo Quilez, "Rendering Worlds with Two Triangles" (2008) · Shadertoy (2013 —) · Mercury — hg_sdf library & demos (2010s) · Media Molecule, Dreams (SDF sculpting, 2020)
- Motion DNA: Shapes are equations, so they melt into each other instead of colliding: blobs bud off and re-merge, a torus grows through them, space itself is repeated and twisted while the camera glides like a demo fly-through.
- Visual DNA: Perfectly smooth glossy primitives fused by soft fillets, a checkerboard floor with soft penumbrae and ambient occlusion, fog fading copies into a gradient sky — the canonical Shadertoy look, introduced through step-count and normal debug views.
- Signature transitions: Debug-view wipes (iterations → normals → lit), smooth-min budding, repetition reveal, twist, gather-back
- Key techniques: Sphere tracing a signed distance field, Polynomial smooth-min blending, Soft shadows (k·h/t) + 4-tap AO, Domain repetition & twist

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Sphere tracing a signed distance field, Polynomial smooth-min blending, Soft shadows (k·h/t) + 4-tap AO, Domain repetition & twist).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Sphere tracing a signed distance field and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RAYMARCHING", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL fragment shader (Shadertoy), Demoscene 4k intros, TouchDesigner / Unity shaders, Canvas 2D (per-pixel CPU march, 480×270). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Raymarching motion-graphics film (Signed Distance Fields). Visual style: perfectly smooth glossy primitives fused by soft fillets, a checkerboard floor with soft penumbrae and ambient occlusion, fog fading copies into a gradient sky — the canonical Shadertoy look, introduced through step-count and normal debug views. Motion: shapes are equations, so they melt into each other instead of colliding: blobs bud off and re-merge, a torus grows through them, space itself is repeated and twisted while the camera glides like a demo fly-through. Signature moves: sphere tracing a signed distance field, polynomial smooth-min blending, soft shadows (k·h/t) + 4-tap ao, domain repetition & twist; transitions: debug-view wipes (iterations → normals → lit), smooth-min budding, repetition reveal, twist, gather-back. In the tradition of Iñigo Quilez / RGBA — Elevated (4k intro, Breakpoint 2009) · Iñigo Quilez, "Rendering Worlds with Two Triangles" (2008) · Shadertoy (2013 —) · Mercury — hg_sdf library & demos (2010s) · Media Molecule, Dreams (SDF sculpting, 2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RAYMARCHING". Punchy sound design synced to every cut.
```
