# MoGraph

*Cinema 4D Cloner Look · 2006 — · 3D & CGI Motion*

Reference film: `videos/mograph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **MoGraph** (Cinema 4D Cloner Look, 2006 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Cinema 4D's MoGraph module let designers drive arrays of objects with effectors, the signature of studio 3D motion.
- Study these reference works: ManvsMachine · Beeple, Everydays (2007 —)
- Motion DNA: Hundreds of clones driven by one field at a time: wave, ripple, twist, random, fall.
- Visual DNA: Studio grey gradient, soft shadows, white clay plus one bold accent.
- Signature transitions: Effector hand-off, scatter and re-form
- Key techniques: Cloner arrays, Effector waves, Camera orbit

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Cloner arrays, Effector waves, Camera orbit).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Cloner arrays and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MOGRAPH", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D, Houdini, Three.js. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second MoGraph motion-graphics film (Cinema 4D Cloner Look). Visual style: studio grey gradient, soft shadows, white clay plus one bold accent. Motion: hundreds of clones driven by one field at a time: wave, ripple, twist, random, fall. Signature moves: cloner arrays, effector waves, camera orbit; transitions: effector hand-off, scatter and re-form. In the tradition of ManvsMachine · Beeple, Everydays (2007 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MOGRAPH". Punchy sound design synced to every cut.
```
