# Chrome

*Mirror metal: the scene and the studio, reflected · 1980 — · Rendering Looks*

Reference film: `videos/lookchrome.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Chrome** (Mirror metal: the scene and the studio, reflected, 1980 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Turner Whitted’s recursive ray tracing (1980) made perfect mirror reflections of the rest of the scene computable, and the reflective spheres of early ray-traced images became the emblem of CGI. Before that, Jim Blinn and Martin Newell’s reflection mapping (1976) faked chrome by looking up a picture of the surroundings, the trick behind the liquid-metal T-1000 of Terminator 2 (1991) and still the basis of image-based lighting. Robert Cook and Kenneth Torrance’s 1982 reflectance model and Christophe Schlick’s 1994 approximation gave metals their tinted, angle-dependent Fresnel reflectance, which rough-metal shading in modern physically based renderers builds on.
- Study these reference works: An Improved Illumination Model for Shaded Display (Turner Whitted, 1980; ray-traced reflective spheres) · Terminator 2: Judgment Day (James Cameron, ILM, 1991; the liquid-metal T-1000) · The 1984 ray-traced still life by Thomas Porter, “1984” (Lucasfilm, distributed ray tracing with glossy reflection)
- Motion DNA: The shared camera orbit carries the reflections across the mirrors: as the camera swings, the floor, the cube and the softbox strips slide over the Token’s face and wrap around the sphere. A wipe turns the plain materials to mirror chrome; roughness then rises in four steps on the beat (0.06 → 0.36), blurring the reflection; a final wipe turns the chrome to gold at a satin roughness of 0.10.
- Visual DNA: The paper studio from the plain render, but the Token and sphere become polished metal: crisp softbox strips and a big key box in the reflections, the blue cube and the floor’s shadows curving across the sphere, a dark ceiling that gives the metal its contrast; then frosted satin and warm gold. Leader-line labels, a roughness ruler, the environment panorama and the Fresnel pass as insets.
- Signature transitions: Wipe from plain to chrome; stepped roughness changes; wipe from chrome to gold
- Key techniques: One-bounce traced reflection, Softbox studio environment, Schlick Fresnel · jittered roughness

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One-bounce traced reflection, Softbox studio environment, Schlick Fresnel · jittered roughness).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One-bounce traced reflection and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHROME", held for about 1 s.

BUILD RULES
- Suggested tools: Ray-traced reflections (Whitted, 1980) and reflection mapping (Blinn & Newell, 1976), Physically based metal: Schlick Fresnel with a tinted F0, GGX-style roughness, Canvas 2D + SDF tracer (js/look-kit.js): one LK.trace bounce per pixel, analytic softbox environment, 5 jittered rays plus an edge-aware blur for roughness. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Chrome motion-graphics film (Mirror metal: the scene and the studio, reflected). Visual style: the paper studio from the plain render, but the Token and sphere become polished metal: crisp softbox strips and a big key box in the reflections, the blue cube and the floor’s shadows curving across the sphere, a dark ceiling that gives the metal its contrast; then frosted satin and warm gold. Leader-line labels, a roughness ruler, the environment panorama and the Fresnel pass as insets. Motion: the shared camera orbit carries the reflections across the mirrors: as the camera swings, the floor, the cube and the softbox strips slide over the Token’s face and wrap around the sphere. A wipe turns the plain materials to mirror chrome; roughness then rises in four steps on the beat (0.06 → 0.36), blurring the reflection; a final wipe turns the chrome to gold at a satin roughness of 0.10. Signature moves: one-bounce traced reflection, softbox studio environment, schlick fresnel · jittered roughness; transitions: wipe from plain to chrome; stepped roughness changes; wipe from chrome to gold. In the tradition of An Improved Illumination Model for Shaded Display (Turner Whitted, 1980; ray-traced reflective spheres) · Terminator 2: Judgment Day (James Cameron, ILM, 1991; the liquid-metal T-1000) · The 1984 ray-traced still life by Thomas Porter, “1984” (Lucasfilm, distributed ray tracing with glossy reflection). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHROME". Punchy sound design synced to every cut.
```
