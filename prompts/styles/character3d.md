# 3D Character Animation

*Squash, Stretch and Performance · 1986 — · 3D & CGI Motion*

Reference film: `videos/character3d.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **3D Character Animation** (Squash, Stretch and Performance, 1986 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Keyframed CG characters that act: the hand-drawn principles of the Disney animators — squash and stretch, anticipation, arcs, follow-through, appeal — applied to 3D models, which John Lasseter set out in his 1987 SIGGRAPH paper after Pixar’s Luxo Jr. (1986) proved two desk lamps could carry a story. Pixar’s Toy Story (1995) made it a feature-film medium, and the soft-lit, rounded, expressive house style it set is now the default language of studio animation, game cinematics and mascot spots.
- Study these reference works: Luxo Jr. (John Lasseter, Pixar, 1986) · Toy Story (John Lasseter, Pixar, 1995) · Geri’s Game (Jan Pinkava, Pixar, 1997) · For the Birds (Ralph Eggleston, Pixar, 2000) · WALL·E (Andrew Stanton, Pixar, 2008) · The Illusion of Life (Frank Thomas & Ollie Johnston, 1981)
- Motion DNA: Acting in poses and timing: every action is announced by an anticipation in the opposite direction, travels on a clean parabolic arc with stretch along the velocity, lands in a squash that springs back through overshoot, while appendages lag and whip through after the body stops; eyes and brows lead the thought a few frames before the body moves.
- Visual DNA: A simple, rounded, saturated character with huge eyes and readable brows on a warm seamless cyc; soft key light with wrapped, subsurface-warm terminators, a cool fill, a bright rim, gentle contact shadows and ambient occlusion, glossy catchlights in the eyes.
- Signature transitions: Held shot with a slow push-in; staging and acting carry the cut points; breakdown captions name each principle
- Key techniques: Volume-kept squash and stretch, Lagged antenna follow-through, Ray-traced soft shadows + AO

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Volume-kept squash and stretch, Lagged antenna follow-through, Ray-traced soft shadows + AO).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Volume-kept squash and stretch and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "3D CHARACTER ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Maya / Presto rigs, keyframed in the graph editor, RenderMan / Arnold / Cycles with area lights + AO, Blender Grease-Pencil blocking, then splined, Canvas 2D: per-pixel ray tracer over ellipsoids (960×540, upscaled), analytic soft shadows and AO. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second 3D Character Animation motion-graphics film (Squash, Stretch and Performance). Visual style: a simple, rounded, saturated character with huge eyes and readable brows on a warm seamless cyc; soft key light with wrapped, subsurface-warm terminators, a cool fill, a bright rim, gentle contact shadows and ambient occlusion, glossy catchlights in the eyes. Motion: acting in poses and timing: every action is announced by an anticipation in the opposite direction, travels on a clean parabolic arc with stretch along the velocity, lands in a squash that springs back through overshoot, while appendages lag and whip through after the body stops; eyes and brows lead the thought a few frames before the body moves. Signature moves: volume-kept squash and stretch, lagged antenna follow-through, ray-traced soft shadows + ao; transitions: held shot with a slow push-in; staging and acting carry the cut points; breakdown captions name each principle. In the tradition of Luxo Jr. (John Lasseter, Pixar, 1986) · Toy Story (John Lasseter, Pixar, 1995) · Geri’s Game (Jan Pinkava, Pixar, 1997) · For the Birds (Ralph Eggleston, Pixar, 2000) · WALL·E (Andrew Stanton, Pixar, 2008) · The Illusion of Life (Frank Thomas & Ollie Johnston, 1981). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "3D CHARACTER ANIMATION". Punchy sound design synced to every cut.
```
