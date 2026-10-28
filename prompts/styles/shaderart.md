# Shader Art

*Fragment shaders & live coding · 2000s — · Experimental & Generative*

Reference film: `videos/shaderart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Shader Art** (Fragment shaders & live coding, 2000s —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Shader art paints every pixel with one small GPU program — a fragment shader that maps a pixel coordinate and the time to a colour — so images are built from maths rather than geometry: signed distance fields, noise, domain warping and folded space. It grew from the demoscene's size-limited intros and was codified by Inigo Quilez, whose articles on SDFs, fbm warping and cosine palettes became the standard references, and whose Shadertoy (2013, with Pol Jeremias) made it a browser-based community; live "shader showdown" battles in Bonzomatic put the coding itself on screen.
- Study these reference works: Inigo Quilez — articles on domain warping, 2D distance functions and cosine palettes (iquilezles.org) · Shadertoy (Inigo Quilez & Pol Jeremias, 2013) · Bonzomatic live-coding tool (Gargaj / Conspiracy) used for Revision's Shader Showdown · The Book of Shaders (Patricio Gonzalez Vivo & Jen Lowe)
- Motion DNA: The image is a pure function of time, so motion is continuous and endless: gradients cycle, blobs melt into each other through smooth-min, warped noise churns like smoke, the kaleidoscope rotates and its palette scrolls outward; each recompile wipes a new program down the screen on the beat.
- Visual DNA: Full-bleed per-pixel colour fields — the default cosine rainbow, orange-and-blue distance-field stripes with a white zero line, teal-and-sand marbled fbm, an eight-fold mirrored mandala in a cosine palette — under monospace GLSL with dark backing boxes and a status bar.
- Signature transitions: Typed code, compile, top-to-bottom scan wipe to the new program; code clears for the title
- Key techniques: Per-pixel shading, SDF smooth-min metaballs, fbm domain warping

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Per-pixel shading, SDF smooth-min metaballs, fbm domain warping).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Per-pixel shading and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SHADER ART", held for about 1 s.

BUILD RULES
- Suggested tools: GLSL fragment shaders (Shadertoy, Bonzomatic, KodeLife), TouchDesigner GLSL TOP, Canvas 2D ImageData emulation. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Shader Art motion-graphics film (Fragment shaders & live coding). Visual style: full-bleed per-pixel colour fields — the default cosine rainbow, orange-and-blue distance-field stripes with a white zero line, teal-and-sand marbled fbm, an eight-fold mirrored mandala in a cosine palette — under monospace GLSL with dark backing boxes and a status bar. Motion: the image is a pure function of time, so motion is continuous and endless: gradients cycle, blobs melt into each other through smooth-min, warped noise churns like smoke, the kaleidoscope rotates and its palette scrolls outward; each recompile wipes a new program down the screen on the beat. Signature moves: per-pixel shading, sdf smooth-min metaballs, fbm domain warping; transitions: typed code, compile, top-to-bottom scan wipe to the new program; code clears for the title. In the tradition of Inigo Quilez — articles on domain warping, 2D distance functions and cosine palettes (iquilezles.org) · Shadertoy (Inigo Quilez & Pol Jeremias, 2013) · Bonzomatic live-coding tool (Gargaj / Conspiracy) used for Revision's Shader Showdown · The Book of Shaders (Patricio Gonzalez Vivo & Jen Lowe). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SHADER ART". Punchy sound design synced to every cut.
```
