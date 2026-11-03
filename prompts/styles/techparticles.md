# Particles

*Emit, age, die · 1982 — · Technique Atlas*

Reference film: `videos/techparticles.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Particles** (Emit, age, die, 1982 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: William T. Reeves at Lucasfilm defined the particle system for the Genesis Effect in Star Trek II: The Wrath of Khan (1982) and described it in Particle Systems — A Technique for Modeling a Class of Fuzzy Objects (SIGGRAPH 1983): emitters generate particles with a birth rate, each gets an initial position, velocity, colour, size and lifetime, moves under simple forces and is killed when its age runs out. The same emit-update-kill loop drives Maya and Houdini particles, Trapcode Particular in After Effects and every game engine’s effects system.
- Study these reference works: Star Trek II: The Wrath of Khan (Nicholas Meyer, 1982; Genesis sequence, Lucasfilm) · Trapcode Particular (Peder Norrby, After Effects plug-in, mid-2000s) · Journey (thatgamecompany, 2012; sand and cloth particles)
- Motion DNA: A trickle that becomes a stream on the beat, fans out as the cone widens, arcs into a fountain when gravity switches on, thickens and hangs as drag bites, drifts to a standstill when gravity goes off, shrinks to a short-lived spray when the lifespan drops, stops, and ends on one 360° burst that rains onto the floor and ages out.
- Visual DNA: The Technique Atlas stage with its floor line: the orange Token standing at left with particles pouring from its hole, each a dot that is born hot white, turns orange and dies small and ink-dark. A dashed spread cone and a gravity arrow at the emitter, one tracked particle ringed with its whole path dotted and its age shown, a parameter panel at right with live count, and the live-particle count as the caption graph.
- Signature transitions: Parameter changes on the beat; the particles already alive keep the values they were born with, while gravity and drag act on all of them at once
- Key techniques: Birth rate integrated to birth times, Per-particle sampling at birth (cone, speed, life), Age → colour and size; kill at lifespan

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Birth rate integrated to birth times, Per-particle sampling at birth (cone, speed, life), Age → colour and size; kill at lifespan).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Birth rate integrated to birth times and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PARTICLES", held for about 1 s.

BUILD RULES
- Suggested tools: Emitter + per-particle state (Reeves 1983 / Houdini POPs / Trapcode Particular), Births from the integrated rate, positions integrated at 240 Hz in setup(), Canvas 2D: age-indexed colour LUT and size, sampled paths interpolated by age. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Particles motion-graphics film (Emit, age, die). Visual style: the Technique Atlas stage with its floor line: the orange Token standing at left with particles pouring from its hole, each a dot that is born hot white, turns orange and dies small and ink-dark. A dashed spread cone and a gravity arrow at the emitter, one tracked particle ringed with its whole path dotted and its age shown, a parameter panel at right with live count, and the live-particle count as the caption graph. Motion: a trickle that becomes a stream on the beat, fans out as the cone widens, arcs into a fountain when gravity switches on, thickens and hangs as drag bites, drifts to a standstill when gravity goes off, shrinks to a short-lived spray when the lifespan drops, stops, and ends on one 360° burst that rains onto the floor and ages out. Signature moves: birth rate integrated to birth times, per-particle sampling at birth (cone, speed, life), age → colour and size; kill at lifespan; transitions: parameter changes on the beat; the particles already alive keep the values they were born with, while gravity and drag act on all of them at once. In the tradition of Star Trek II: The Wrath of Khan (Nicholas Meyer, 1982; Genesis sequence, Lucasfilm) · Trapcode Particular (Peder Norrby, After Effects plug-in, mid-2000s) · Journey (thatgamecompany, 2012; sand and cloth particles). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PARTICLES". Punchy sound design synced to every cut.
```
