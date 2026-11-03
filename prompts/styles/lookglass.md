# Glass

*Light bent by Snell’s law, tinted by thickness · 1980 — · Rendering Looks*

Reference film: `videos/lookglass.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Glass** (Light bent by Snell’s law, tinted by thickness, 1980 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Turner Whitted’s 1980 ray tracer was the first to follow rays through transparent objects, bending them at each surface by Snell’s law and splitting off a reflected ray, and his glass spheres over a checkerboard became one of computer graphics’ defining images. The Fresnel equations set how much light reflects at each angle, and Beer–Lambert absorption colours glass by the distance light travels inside it. Caustics — light focused by the glass onto the floor — needed later techniques such as Henrik Wann Jensen’s photon mapping (1990s); here a ball-lens approximation stands in.
- Study these reference works: An Improved Illumination Model for Shaded Display (Turner Whitted, 1980; glass spheres over a checkerboard) · Henrik Wann Jensen, photon-mapped caustic renders (1996 onwards) · Glass and crystal product visualisation (KeyShot, V-Ray)
- Motion DNA: The shared camera orbit slides the world behind the glass: the floor’s edge, the cube and the shadows swim through the Token and the sphere as the camera moves. A wipe turns them to glass at IOR 1.00, where nothing bends and only the tint shows; the index then rises on eased ramps to 1.50 (glass), where the sphere flips the floor upside down and the caustic gathers, and to 2.42 (diamond), where total internal reflection fills the Token with bright facets.
- Visual DNA: The paper studio seen through amber and pale-aqua glass: the dark studio ceiling and softboxes in the Fresnel rims, deeper colour where the glass is thicker, tinted translucent shadows, a bright focused caustic in the sphere’s shadow. An IOR ruler with air, water, glass and diamond marked, leader-line labels, thickness and Fresnel pass insets.
- Signature transitions: Wipe from plain to glass; the index of refraction ramps between named materials
- Key techniques: Snell refraction in and out, Fresnel reflection mix, Beer–Lambert tint · ball-lens caustic

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Snell refraction in and out, Fresnel reflection mix, Beer–Lambert tint · ball-lens caustic).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Snell refraction in and out and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GLASS", held for about 1 s.

BUILD RULES
- Suggested tools: Whitted-style recursive ray tracing of dielectrics, Fresnel (Schlick) reflectance and Beer–Lambert absorption, as in physically based glass shaders, Canvas 2D + SDF tracer (js/look-kit.js): refract → LK.traceInside → refract (one TIR bounce) → LK.trace, a traced reflection, per-object soft shadows and an analytic ball-lens caustic. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Glass motion-graphics film (Light bent by Snell’s law, tinted by thickness). Visual style: the paper studio seen through amber and pale-aqua glass: the dark studio ceiling and softboxes in the Fresnel rims, deeper colour where the glass is thicker, tinted translucent shadows, a bright focused caustic in the sphere’s shadow. An IOR ruler with air, water, glass and diamond marked, leader-line labels, thickness and Fresnel pass insets. Motion: the shared camera orbit slides the world behind the glass: the floor’s edge, the cube and the shadows swim through the Token and the sphere as the camera moves. A wipe turns them to glass at IOR 1.00, where nothing bends and only the tint shows; the index then rises on eased ramps to 1.50 (glass), where the sphere flips the floor upside down and the caustic gathers, and to 2.42 (diamond), where total internal reflection fills the Token with bright facets. Signature moves: snell refraction in and out, fresnel reflection mix, beer–lambert tint · ball-lens caustic; transitions: wipe from plain to glass; the index of refraction ramps between named materials. In the tradition of An Improved Illumination Model for Shaded Display (Turner Whitted, 1980; glass spheres over a checkerboard) · Henrik Wann Jensen, photon-mapped caustic renders (1996 onwards) · Glass and crystal product visualisation (KeyShot, V-Ray). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GLASS". Punchy sound design synced to every cut.
```
