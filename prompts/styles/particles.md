# Generative Particles

*Flow Fields · 2001 — · Experimental & Generative*

Reference film: `videos/particles.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Generative Particles** (Flow Fields, 2001 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Creative coding tools such as Processing turned noise fields and particle systems into living, data-driven sculpture.
- Study these reference works: Processing (2001) · Refik Anadol, data sculptures
- Motion DNA: Thousands of particles advected through a noise field; attraction pulls them into form, release scatters them.
- Visual DNA: Dark ground, luminous additive strands, cool palette.
- Signature transitions: Converge into type, shockwave release
- Key techniques: Noise flow field, Additive trails, Form & dissolve

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Noise flow field, Additive trails, Form & dissolve).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Noise flow field and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GENERATIVE PARTICLES", held for about 1 s.

BUILD RULES
- Suggested tools: Processing, TouchDesigner, WebGL, Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Generative Particles motion-graphics film (Flow Fields). Visual style: dark ground, luminous additive strands, cool palette. Motion: thousands of particles advected through a noise field; attraction pulls them into form, release scatters them. Signature moves: noise flow field, additive trails, form & dissolve; transitions: converge into type, shockwave release. In the tradition of Processing (2001) · Refik Anadol, data sculptures. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GENERATIVE PARTICLES". Punchy sound design synced to every cut.
```
