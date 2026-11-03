# Clay

*One matte material, so only form and light remain · 1990s — · Rendering Looks*

Reference film: `videos/lookclay.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Clay** (One matte material, so only form and light remain, 1990s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The clay render comes from the CG production pipeline: lighters and modellers override every shader with one neutral, matte material to judge form, silhouette and lighting before textures and colour arrive, and studios show the same untextured passes in breakdown reels. The name borrows from sculptors’ clay maquettes. As global illumination and ambient occlusion became cheap in renderers such as V-Ray and mental ray in the 2000s, the soft-lit white clay render also became a look of its own in architectural visualisation and motion design.
- Study these reference works: Pixar and ILM shot breakdowns (untextured layout and lighting passes) · Architectural visualisation clay renders (V-Ray, Corona) · Studio motion-design reels in white and pastel clay (Cinema 4D)
- Motion DNA: The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. One wipe left to right replaces the plain materials with white clay; callouts name what clay hides and what it reveals while the AO and key-light passes sit as insets; a second wipe tints the clay per object in pastels.
- Visual DNA: Warm off-white clay on a matching floor that fades into the paper backdrop; soft broad shadows, deep contact occlusion under the Token, sphere and cube, a faint warm glow along each terminator; at the end pastel coral, mint and periwinkle. Ink mono labels with leader lines, an orange split line, two framed pass insets.
- Signature transitions: Wipe from the plain reference to white clay; wipe from white clay to pastel clay
- Key techniques: Material override: one matte albedo, Big soft key + strong AO, Subsurface warmth at the terminator

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Material override: one matte albedo, Big soft key + strong AO, Subsurface warmth at the terminator).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Material override: one matte albedo and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLAY", held for about 1 s.

BUILD RULES
- Suggested tools: Material override / clay pass in Maya, Cinema 4D, Blender, Ambient-occlusion and key-light passes for lookdev, Canvas 2D + SDF tracer (js/look-kit.js): one matte albedo, low-hardness soft shadow, 6-tap AO raised to 1.6, terminator-band warmth. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Clay motion-graphics film (One matte material, so only form and light remain). Visual style: warm off-white clay on a matching floor that fades into the paper backdrop; soft broad shadows, deep contact occlusion under the Token, sphere and cube, a faint warm glow along each terminator; at the end pastel coral, mint and periwinkle. Ink mono labels with leader lines, an orange split line, two framed pass insets. Motion: the shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. One wipe left to right replaces the plain materials with white clay; callouts name what clay hides and what it reveals while the AO and key-light passes sit as insets; a second wipe tints the clay per object in pastels. Signature moves: material override: one matte albedo, big soft key + strong ao, subsurface warmth at the terminator; transitions: wipe from the plain reference to white clay; wipe from white clay to pastel clay. In the tradition of Pixar and ILM shot breakdowns (untextured layout and lighting passes) · Architectural visualisation clay renders (V-Ray, Corona) · Studio motion-design reels in white and pastel clay (Cinema 4D). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLAY". Punchy sound design synced to every cut.
```
