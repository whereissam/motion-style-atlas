# Volumetric Light

*God rays through haze, single scattering · 1980s — · Rendering Looks*

Reference film: `videos/lookvolumetric.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Volumetric Light** (God rays through haze, single scattering, 1980s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Shafts of light through haze — crepuscular rays — were a painter’s and cinematographer’s device long before rendering, built on set with smoke and a hard source through a window. In computer graphics, Jim Blinn’s 1982 paper on light reflection by clouds and dusty surfaces and Kajiya and Von Herzen’s 1984 “Ray Tracing Volume Densities” laid the ground for rendering participating media. Real-time engines adopted ray-marched single scattering against a shadow map in the 2010s, so god rays became a standard game-engine effect.
- Study these reference works: Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Raiders of the Lost Ark (Steven Spielberg, 1981; the Map Room sunbeam) · Inside (Playdead, 2016)
- Motion DNA: The camera makes the same slow 50° orbit while the shafts swing across the view, carved by the Token as it turns and bobs. The haze fades in over the first two seconds (density σ 0 → 0.11), the march steps per ray double on the beat (8 → 16 → 32) so the jittered banding settles, and the haze thickens a little near the end. Dust motes drift down through the beams.
- Visual DNA: A near-black room, a 3 × 2 window of warm light falling from above and behind, its bars printed on the floor and repeated as dark planes in the air. The Token’s shadow is a solid dark shaft with a bright beam through its hole; the sphere and cube cut their own. Insets show the in-scatter pass alone and one view ray’s lit and shadowed samples.
- Signature transitions: Haze fades in from a clear room; step counts change on the beat
- Key techniques: Ray-marched single scattering, Light-space shadow map, Henyey–Greenstein phase

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ray-marched single scattering, Light-space shadow map, Henyey–Greenstein phase).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ray-marched single scattering and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VOLUMETRIC LIGHT", held for about 1 s.

BUILD RULES
- Suggested tools: Unreal Engine: exponential height fog with volumetric fog, Blender: Principled Volume in a world box, spot or area light, Canvas 2D + SDF tracer (js/look-kit.js): per-frame light-space shadow map, half-res jittered ray march clipped to the window prism, HG phase, Beer–Lambert transmittance, depth-aware upsample. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Volumetric Light motion-graphics film (God rays through haze, single scattering). Visual style: a near-black room, a 3 × 2 window of warm light falling from above and behind, its bars printed on the floor and repeated as dark planes in the air. The Token’s shadow is a solid dark shaft with a bright beam through its hole; the sphere and cube cut their own. Insets show the in-scatter pass alone and one view ray’s lit and shadowed samples. Motion: the camera makes the same slow 50° orbit while the shafts swing across the view, carved by the Token as it turns and bobs. The haze fades in over the first two seconds (density σ 0 → 0.11), the march steps per ray double on the beat (8 → 16 → 32) so the jittered banding settles, and the haze thickens a little near the end. Dust motes drift down through the beams. Signature moves: ray-marched single scattering, light-space shadow map, henyey–greenstein phase; transitions: haze fades in from a clear room; step counts change on the beat. In the tradition of Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Raiders of the Lost Ark (Steven Spielberg, 1981; the Map Room sunbeam) · Inside (Playdead, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VOLUMETRIC LIGHT". Punchy sound design synced to every cut.
```
