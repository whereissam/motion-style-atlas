# Rigid Body

*Impulses, friction, stacking · 1988 — · Technique Atlas*

Reference film: `videos/techrigidbody.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rigid Body** (Impulses, friction, stacking, 1988 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Rigid-body dynamics moves solid objects by integrating linear and angular momentum and resolving every contact so nothing interpenetrates. James Hahn’s Realistic Animation of Rigid Bodies and Moore and Wilhelms’ collision response (both SIGGRAPH 1988) brought it to animation, David Baraff’s analytical contact methods (1989 onward) made resting contact solvable, Mirtich and Canny popularised impulse-based simulation (1995), and Erin Catto’s sequential impulses in Box2D (2006–07) became the standard game solver.
- Study these reference works: Half-Life 2 (Valve, 2004; Havok physics) · Garry’s Mod (Facepunch, 2006) · Angry Birds (Rovio, 2009; Box2D)
- Motion DNA: Tokens fall in on the eighth-note grid, hit the floor and each other with a short restitution bounce, then tumble, slide and lock against friction; the pile grows and shuffles under each new arrival until kinetic energy bleeds away. A last Token lands flat on top of the word with a thud, and everything comes to rest for a still hold.
- Visual DNA: Warm paper studio with a grid and floor line; orange, light-orange, dark-orange and ink Tokens in many sizes, the hole in each showing its rotation, soft contact shadows on the floor; MOTION set heavy and black on the floor at right, acting as a solid; a kinetic-energy graph traced in the corner.
- Signature transitions: Empty stage, cascade, settle, still hold — the energy curve falls to zero
- Key techniques: SAT + clipping contacts on rounded boxes, Warm-started sequential impulses, Coulomb friction and restitution

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (SAT + clipping contacts on rounded boxes, Warm-started sequential impulses, Coulomb friction and restitution).
- 5.0–8.0 s  Climax: the most spectacular moment, built on SAT + clipping contacts on rounded boxes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RIGID BODY", held for about 1 s.

BUILD RULES
- Suggested tools: 2D sequential-impulse solver (Box2D-lite style) precomputed in setup, Rounded-box contacts from SAT, edge clipping and radius, Audio thuds from the recorded contact events. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rigid Body motion-graphics film (Impulses, friction, stacking). Visual style: warm paper studio with a grid and floor line; orange, light-orange, dark-orange and ink Tokens in many sizes, the hole in each showing its rotation, soft contact shadows on the floor; MOTION set heavy and black on the floor at right, acting as a solid; a kinetic-energy graph traced in the corner. Motion: tokens fall in on the eighth-note grid, hit the floor and each other with a short restitution bounce, then tumble, slide and lock against friction; the pile grows and shuffles under each new arrival until kinetic energy bleeds away. A last Token lands flat on top of the word with a thud, and everything comes to rest for a still hold. Signature moves: sat + clipping contacts on rounded boxes, warm-started sequential impulses, coulomb friction and restitution; transitions: empty stage, cascade, settle, still hold — the energy curve falls to zero. In the tradition of Half-Life 2 (Valve, 2004; Havok physics) · Garry’s Mod (Facepunch, 2006) · Angry Birds (Rovio, 2009; Box2D). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RIGID BODY". Punchy sound design synced to every cut.
```
