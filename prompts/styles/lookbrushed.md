# Brushed Metal

*Anisotropic highlights, stretched across the grain · 1992 — · Rendering Looks*

Reference film: `videos/lookbrushed.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Brushed Metal** (Anisotropic highlights, stretched across the grain, 1992 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Brushed, spun and turned metal reflects light anisotropically: the fine grooves scatter it across their direction and hardly at all along it, so highlights become streaks at right angles to the grain. James Kajiya treated anisotropic surfaces in 1985, and Gregory Ward’s 1992 SIGGRAPH paper “Measuring and Modeling Anisotropic Reflection” gave rendering the compact elliptical-Gaussian lobe with two roughnesses that is still the textbook model; Michael Ashikhmin and Peter Shirley’s anisotropic Phong model (2000) followed. Modern physically based shaders (Disney’s principled BRDF, 2012, and its descendants) expose the same idea as an “anisotropic” slider and a tangent direction.
- Study these reference works: Measuring and Modeling Anisotropic Reflection (Gregory Ward, SIGGRAPH 1992) · An Anisotropic Phong BRDF Model (Michael Ashikhmin & Peter Shirley, 2000) · Physically Based Shading at Disney (Brent Burley, SIGGRAPH 2012; the anisotropic parameter of the principled BRDF)
- Motion DNA: The shared 10 s orbit drags the streaks across the metal: on the Token they swing round its centre like a spun disc, on the sphere they run pole to pole, on the cube across the grain. A wipe turns the plain materials to brushed metal; callouts and the tangent-field inset explain the grooves; the anisotropy ratio αB:αT then steps 2 → 5 → 12 → 28 on the beat at constant mean roughness, and a split slides in from the right to compare against isotropic metal of the same mean roughness.
- Visual DNA: Brushed aluminium in three anodised tints — orange Token, bare steel sphere, blue cube — in the paper studio with a dark ceiling: long soft streaks of softbox light, fine concentric rings and straight grain in the metal, blurred reflections of the floor. An orange split line, leader-line labels, a ratio readout with a log ruler, and a hue-coded tangent-field inset with white groove strokes.
- Signature transitions: Wipe from plain to brushed metal; stepped anisotropy ratio; split to isotropic metal
- Key techniques: Ward anisotropic lobe, αT ≠ αB, Per-object tangent field, Reflection blurred along the bitangent

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ward anisotropic lobe, αT ≠ αB, Per-object tangent field, Reflection blurred along the bitangent).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ward anisotropic lobe, αT ≠ αB and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BRUSHED METAL", held for about 1 s.

BUILD RULES
- Suggested tools: Ward (1992) anisotropic BRDF with per-surface tangent frames, Tangent / anisotropy maps as in Disney principled and Arnold standard surface, Canvas 2D + SDF tracer (js/look-kit.js): analytic Ward lobes for four softboxes, one LK.trace reflection, an edge-aware blur along the projected bitangent, groove noise in the across-grain coordinate. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Brushed Metal motion-graphics film (Anisotropic highlights, stretched across the grain). Visual style: brushed aluminium in three anodised tints — orange Token, bare steel sphere, blue cube — in the paper studio with a dark ceiling: long soft streaks of softbox light, fine concentric rings and straight grain in the metal, blurred reflections of the floor. An orange split line, leader-line labels, a ratio readout with a log ruler, and a hue-coded tangent-field inset with white groove strokes. Motion: the shared 10 s orbit drags the streaks across the metal: on the Token they swing round its centre like a spun disc, on the sphere they run pole to pole, on the cube across the grain. A wipe turns the plain materials to brushed metal; callouts and the tangent-field inset explain the grooves; the anisotropy ratio αB:αT then steps 2 → 5 → 12 → 28 on the beat at constant mean roughness, and a split slides in from the right to compare against isotropic metal of the same mean roughness. Signature moves: ward anisotropic lobe, αt ≠ αb, per-object tangent field, reflection blurred along the bitangent; transitions: wipe from plain to brushed metal; stepped anisotropy ratio; split to isotropic metal. In the tradition of Measuring and Modeling Anisotropic Reflection (Gregory Ward, SIGGRAPH 1992) · An Anisotropic Phong BRDF Model (Michael Ashikhmin & Peter Shirley, 2000) · Physically Based Shading at Disney (Brent Burley, SIGGRAPH 2012; the anisotropic parameter of the principled BRDF). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BRUSHED METAL". Punchy sound design synced to every cut.
```
