# Fresnel X-ray

*Light only where surfaces turn away · 1990s — · Rendering Looks*

Reference film: `videos/lookxray.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Fresnel X-ray** (Light only where surfaces turn away, 1990s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Fresnel’s equations (Augustin-Jean Fresnel, 1820s) say surfaces reflect more as they turn edge-on to the eye, and Christophe Schlick’s 1994 approximation reduced that rise to a cheap power of (1 − cos θ). Driven by the facing ratio |n·v| and added onto black with depth testing off, the same edge term draws only an object’s rims, hole walls and far sides: the see-through hologram and x-ray look of film interfaces and game vision modes.
- Study these reference works: Iron Man (Jon Favreau, 2008; holographic workshop interfaces) · Batman: Arkham Asylum (Rocksteady, 2009; Detective Mode) · Prometheus (Ridley Scott, 2012; holographic star map)
- Motion DNA: After a wipe from the plain render, the camera makes the shared orbit while the exponent p steps on the beat: 1.5 (a soft ghost), 3.2, 6.5 (thin wire-like rims), 0.75 (a solid glow), settling at 2.4. The hue drifts from cyan to violet, then to amber; a slow scan band rolls down the frame.
- Visual DNA: Near-black blue ground with a faint glowing floor grid that shows through the objects. The Token, sphere and cube are drawn only as glowing rims, with their back faces and the Token’s hole wall visible through the front faces, plus bloom on the brightest edges. Two dark insets show |n·v| and the edge term.
- Signature transitions: A vertical wipe from plain to x-ray; exponent steps on the beat; hue crossfades
- Key techniques: Facing-ratio edge term (1 − |n·v|)^p, Additive, through every surface, Bloom and faint scanlines

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Facing-ratio edge term (1 − |n·v|)^p, Additive, through every surface, Bloom and faint scanlines).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Facing-ratio edge term (1 − |n·v|)^p and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRESNEL X-RAY", held for about 1 s.

BUILD RULES
- Suggested tools: Fresnel / facing-ratio shader with additive blending (Unity, Unreal), Rim or “x-ray” material in a DCC (Maya, Blender facing-ratio node), Canvas 2D + SDF tracer (js/look-kit.js): each ray walks every surface via LK.trace and LK.traceInside, summing the edge term, then bloom. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Fresnel X-ray motion-graphics film (Light only where surfaces turn away). Visual style: near-black blue ground with a faint glowing floor grid that shows through the objects. The Token, sphere and cube are drawn only as glowing rims, with their back faces and the Token’s hole wall visible through the front faces, plus bloom on the brightest edges. Two dark insets show |n·v| and the edge term. Motion: after a wipe from the plain render, the camera makes the shared orbit while the exponent p steps on the beat: 1.5 (a soft ghost), 3.2, 6.5 (thin wire-like rims), 0.75 (a solid glow), settling at 2.4. The hue drifts from cyan to violet, then to amber; a slow scan band rolls down the frame. Signature moves: facing-ratio edge term (1 − |n·v|)^p, additive, through every surface, bloom and faint scanlines; transitions: a vertical wipe from plain to x-ray; exponent steps on the beat; hue crossfades. In the tradition of Iron Man (Jon Favreau, 2008; holographic workshop interfaces) · Batman: Arkham Asylum (Rocksteady, 2009; Detective Mode) · Prometheus (Ridley Scott, 2012; holographic star map). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRESNEL X-RAY". Punchy sound design synced to every cut.
```
