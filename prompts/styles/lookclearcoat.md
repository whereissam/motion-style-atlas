# Clear Coat

*A glossy clear layer over a coloured base: two lobes · 2000s — · Rendering Looks*

Reference film: `videos/lookclearcoat.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Clear Coat** (A glossy clear layer over a coloured base: two lobes, 2000s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Automotive paint is built in layers — primer, a coloured basecoat often loaded with aluminium or mica flakes, and a transparent clearcoat — and car-paint shaders in visualisation tools copied that stack. Physically based layered materials made it general: Disney’s principled BRDF (Brent Burley, 2012) included a separate clearcoat lobe with its own gloss over the base, and the coat layer became a standard parameter in production and real-time materials, from Autodesk Standard Surface’s coat to the KHR_materials_clearcoat glTF extension and the clear-coat shading models of Unreal Engine and Filament.
- Study these reference works: Cars (Pixar, 2006; ray-traced reflections on lacquered car paint) · Disney principled BRDF, “Physically Based Shading at Disney” (Brent Burley, SIGGRAPH 2012 course; clearcoat lobe) · Autodesk Standard Surface coat layer / glTF KHR_materials_clearcoat
- Motion DNA: The shared camera orbit drags the coat’s reflections across the forms: softbox strips and the floor’s horizon slide over the Token’s face and wrap the sphere, while the flakes glint and go out as their angles pass the key. A wipe lacquers the plain materials; on beat 6 the coat switches off and only the base lobe is left, flat and satin; from beat 7.5 its strength fades back in; roughness then steps on the beat (0 → 0.10 → 0.22 → 0.38) and snaps back to glass-smooth, and a last split shows coat on beside coat off.
- Visual DNA: Product-shot paper studio: a candy-orange metallic flake Token, a deep teal and a cobalt lacquered-ceramic sphere and cube, each with a crisp white studio reflection floating on top of its colour, brightest at the silhouettes. Strength and roughness rulers, the base and coat lobes as separate insets, leader-line labels, an orange split line.
- Signature transitions: Wipe from plain to clear coat; coat off (cut) and back on (fade); stepped coat roughness; split coat on / off
- Key techniques: Base lobe: diffuse + metallic flakes, Coat lobe: traced reflection, Schlick F0 0.04, Coat on / off, strength, roughness

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Base lobe: diffuse + metallic flakes, Coat lobe: traced reflection, Schlick F0 0.04, Coat on / off, strength, roughness).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Base lobe: diffuse + metallic flakes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLEAR COAT", held for about 1 s.

BUILD RULES
- Suggested tools: Layered BRDFs: clearcoat lobe over base (Disney principled BRDF 2012, Autodesk Standard Surface, glTF KHR_materials_clearcoat), Car-paint shaders: metallic flake normals in a cell grid under a dielectric coat, Canvas 2D + SDF tracer (js/look-kit.js): base lobe with hashed flake normals, one LK.trace coat bounce with Schlick F0 0.04 kept in its own buffer, edge-aware blur for coat roughness. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Clear Coat motion-graphics film (A glossy clear layer over a coloured base: two lobes). Visual style: product-shot paper studio: a candy-orange metallic flake Token, a deep teal and a cobalt lacquered-ceramic sphere and cube, each with a crisp white studio reflection floating on top of its colour, brightest at the silhouettes. Strength and roughness rulers, the base and coat lobes as separate insets, leader-line labels, an orange split line. Motion: the shared camera orbit drags the coat’s reflections across the forms: softbox strips and the floor’s horizon slide over the Token’s face and wrap the sphere, while the flakes glint and go out as their angles pass the key. A wipe lacquers the plain materials; on beat 6 the coat switches off and only the base lobe is left, flat and satin; from beat 7.5 its strength fades back in; roughness then steps on the beat (0 → 0.10 → 0.22 → 0.38) and snaps back to glass-smooth, and a last split shows coat on beside coat off. Signature moves: base lobe: diffuse + metallic flakes, coat lobe: traced reflection, schlick f0 0.04, coat on / off, strength, roughness; transitions: wipe from plain to clear coat; coat off (cut) and back on (fade); stepped coat roughness; split coat on / off. In the tradition of Cars (Pixar, 2006; ray-traced reflections on lacquered car paint) · Disney principled BRDF, “Physically Based Shading at Disney” (Brent Burley, SIGGRAPH 2012 course; clearcoat lobe) · Autodesk Standard Surface coat layer / glTF KHR_materials_clearcoat. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLEAR COAT". Punchy sound design synced to every cut.
```
