# Flocking

*Three local steering rules, no leader · 1987 — · Technique Atlas*

Reference film: `videos/techflocking.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Flocking** (Three local steering rules, no leader, 1987 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Craig Reynolds introduced boids in “Flocks, Herds, and Schools: A Distributed Behavioral Model” at SIGGRAPH 1987: each agent sees only nearby flockmates and steers by separation, alignment and cohesion, and flocking emerges with nobody choreographing it. The method went straight into film crowds — the bat swarms and penguins of Batman Returns (1992) — and later into dedicated crowd and swarm tools such as Massive and Houdini’s crowd and POP solvers.
- Study these reference works: Stanley and Stella in: Breaking the Ice (Symbolics with Whitney / Demos, 1987; Reynolds’ boids) · Batman Returns (Tim Burton, 1992; bat swarms and penguin army) · The Lion King (Disney, 1994; wildebeest stampede)
- Motion DNA: Disorder becoming order one rule at a time, on the beat: with no rules the Tokens wander and cross; separation spaces them out; alignment turns them into parallel streams; cohesion pulls the streams into flocks that bank together at the walls. A big Token then dives through the flock, which bursts open around it and closes behind; once it leaves, the flock re-forms.
- Visual DNA: The Technique Atlas stage with 120 small orange Tokens, each rotated to its heading and trailing a faint line of its last frames; one inked boid with its dashed neighbour and separation radii, thin links to its neighbours and colour-coded steering arrows; a rule panel with switches; the big predator Token with its flee radius.
- Signature transitions: Rules switch on at 1.5, 3.0 and 4.5 s; predator in at 6.5 s, breaks off at 8.6 s and leaves frame
- Key techniques: Neighbour radius 120 px, separation 44 px, Steering = Σ weighted rule forces, clamped speed, Predator: flee force inside 320 px

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Neighbour radius 120 px, separation 44 px, Steering = Σ weighted rule forces, clamped speed, Predator: flee force inside 320 px).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Neighbour radius 120 px, separation 44 px and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FLOCKING", held for about 1 s.

BUILD RULES
- Suggested tools: Reynolds steering behaviours (1987), Houdini POP / crowd solvers, Massive, Unity and Unreal boids, Canvas 2D: O(N²) boids precomputed at 60 Hz in setup(), 301 frames interpolated. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Seeded simulation.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Flocking motion-graphics film (Three local steering rules, no leader). Visual style: the Technique Atlas stage with 120 small orange Tokens, each rotated to its heading and trailing a faint line of its last frames; one inked boid with its dashed neighbour and separation radii, thin links to its neighbours and colour-coded steering arrows; a rule panel with switches; the big predator Token with its flee radius. Motion: disorder becoming order one rule at a time, on the beat: with no rules the Tokens wander and cross; separation spaces them out; alignment turns them into parallel streams; cohesion pulls the streams into flocks that bank together at the walls. A big Token then dives through the flock, which bursts open around it and closes behind; once it leaves, the flock re-forms. Signature moves: neighbour radius 120 px, separation 44 px, steering = σ weighted rule forces, clamped speed, predator: flee force inside 320 px; transitions: rules switch on at 1.5, 3.0 and 4.5 s; predator in at 6.5 s, breaks off at 8.6 s and leaves frame. In the tradition of Stanley and Stella in: Breaking the Ice (Symbolics with Whitney / Demos, 1987; Reynolds’ boids) · Batman Returns (Tim Burton, 1992; bat swarms and penguin army) · The Lion King (Disney, 1994; wildebeest stampede). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FLOCKING". Punchy sound design synced to every cut.
```
