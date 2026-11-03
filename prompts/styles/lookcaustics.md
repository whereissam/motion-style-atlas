# Caustics

*Light gathered into lines by a curved surface · 1990s — · Rendering Looks*

Reference film: `videos/lookcaustics.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Caustics** (Light gathered into lines by a curved surface, 1990s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A caustic is the envelope of light rays focused by a curved reflecting or refracting surface; the term was introduced by Ehrenfried Walther von Tschirnhaus in the 1680s, and the bright net on a pool floor is the everyday example. Ordinary ray tracing cannot find caustics, because a diffuse surface does not know which direction a focused light reaches it from. James Arvo’s backward ray tracing (1986) first traced light from the source and stored it on surfaces, and Henrik Wann Jensen’s photon mapping (1996) made it practical. Real-time water renders approximate the same idea with a caustic texture computed from the water’s height field and projected along the light.
- Study these reference works: Finding Nemo (Pixar, 2003; animated caustics on the reef and the fish) · Henrik Wann Jensen, photon-mapped caustic renders (1996 onwards) · Crysis (Crytek, 2007; projected water caustics in real time)
- Motion DNA: The shared 50° camera orbit, under a living net of light: the height field evolves with deep-water dispersion, so the caustic cells form, stretch, merge and split without sliding. A wipe opens the pool from the plain studio; then the ripple amplitude steps up on the beat, 0.40 → 0.75 → 1.05 → 1.40, and the soft dappling sharpens into thin bright lines as the focus of the curved surface comes up to the floor.
- Visual DNA: An aqua pool: a pale sand-blue floor fading into blue-green water, red light absorbed first with distance, the orange Token and blue cube netted with bright white-cyan caustic lines on every face that sees the sun, hard-edged dark shadows where the lines stop, a clear glass sphere with a focused, rippling spot in its shadow. Insets: the height field, the caustic photon map, and a cross-section of parallel rays bending at the surface and gathering into peaks.
- Signature transitions: Wipe from the plain reference into the pool; ripple amplitude steps up on the beat
- Key techniques: Height field → photon density map, Projection along the light, masked by shadow, Photons through a glass ball lens

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Height field → photon density map, Projection along the light, masked by shadow, Photons through a glass ball lens).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Height field → photon density map and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CAUSTICS", held for about 1 s.

BUILD RULES
- Suggested tools: Photon mapping (Jensen) for caustics in offline renderers: V-Ray, RenderMan, Arnold, Real-time water: caustic texture from the water height field, projected along the light and masked by the shadow map (Unity, Unreal), Canvas 2D + SDF tracer (js/look-kit.js): 14-wave seeded spectral height field, 288² photons per depth splatted into 144² periodic maps, light-direction projection × N·L × soft shadow, 53k analytic photons through the IOR 1.5 sphere, one refraction pass for the glass. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Caustics motion-graphics film (Light gathered into lines by a curved surface). Visual style: an aqua pool: a pale sand-blue floor fading into blue-green water, red light absorbed first with distance, the orange Token and blue cube netted with bright white-cyan caustic lines on every face that sees the sun, hard-edged dark shadows where the lines stop, a clear glass sphere with a focused, rippling spot in its shadow. Insets: the height field, the caustic photon map, and a cross-section of parallel rays bending at the surface and gathering into peaks. Motion: the shared 50° camera orbit, under a living net of light: the height field evolves with deep-water dispersion, so the caustic cells form, stretch, merge and split without sliding. A wipe opens the pool from the plain studio; then the ripple amplitude steps up on the beat, 0.40 → 0.75 → 1.05 → 1.40, and the soft dappling sharpens into thin bright lines as the focus of the curved surface comes up to the floor. Signature moves: height field → photon density map, projection along the light, masked by shadow, photons through a glass ball lens; transitions: wipe from the plain reference into the pool; ripple amplitude steps up on the beat. In the tradition of Finding Nemo (Pixar, 2003; animated caustics on the reef and the fish) · Henrik Wann Jensen, photon-mapped caustic renders (1996 onwards) · Crysis (Crytek, 2007; projected water caustics in real time). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CAUSTICS". Punchy sound design synced to every cut.
```
