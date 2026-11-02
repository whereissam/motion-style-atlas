# Rope

*Verlet nodes, distance constraints · 1967 — · Technique Atlas*

Reference film: `videos/techrope.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rope** (Verlet nodes, distance constraints, 1967 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Verlet integration was introduced to molecular dynamics by Loup Verlet in 1967: positions advance from the current and previous position, so velocity is implicit. Thomas Jakobsen’s Advanced Character Physics (GDC 2001), written from IO Interactive’s Hitman, paired it with relaxation — repeatedly projecting each distance constraint back to its rest length — and the more passes per step, the stiffer the result. Müller, Heidelberger, Hennix and Ratcliff generalised the idea as Position Based Dynamics (2006); ropes, chains, hair and cables in games and rigging tools are built on it.
- Study these reference works: Hitman: Codename 47 (IO Interactive, 2000; Verlet ragdolls) · Cut the Rope (ZeptoLab, 2010) · Half-Life 2 (Valve, 2004; physics ropes and cables)
- Motion DNA: Held out to the side and let go on the beat, the Token swings as a heavy pendulum on a chain that bows behind it. The anchor jerks right then left, and whip-waves run down the links. At 4 s the solver drops to one pass and the rope stretches like a bungee, bouncing the Token low; at 6 s it returns to twenty and the rope snaps taut, kicking the Token up. Then the anchor descends, the Token lands and stands, and the rope folds down onto the floor and settles.
- Visual DNA: The Technique Atlas stage with its floor line: an ink anchor ring, a thick rope of 24 links coloured by strain (ink at rest length, orange when stretched) with every node drawn as a point, the orange Token hanging from the last node. A large iteration counter with twenty pips, a one-link projection diagram and rope length readout at right; rope stretch as the caption graph.
- Signature transitions: A release, kinematic yanks, and a solver setting switched on the beat
- Key techniques: Verlet integration (position + previous position), Distance-constraint relaxation, N passes per step, Kinematic anchor, heavy end mass, floor friction

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Verlet integration (position + previous position), Distance-constraint relaxation, N passes per step, Kinematic anchor, heavy end mass, floor friction).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Verlet integration (position + previous position) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ROPE", held for about 1 s.

BUILD RULES
- Suggested tools: Verlet + constraint relaxation (Jakobsen 2001 / Position Based Dynamics), Simulated once in setup() at 240 Hz, iteration count keyed over time, Canvas 2D: per-link strain colour, interpolated node positions. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rope motion-graphics film (Verlet nodes, distance constraints). Visual style: the Technique Atlas stage with its floor line: an ink anchor ring, a thick rope of 24 links coloured by strain (ink at rest length, orange when stretched) with every node drawn as a point, the orange Token hanging from the last node. A large iteration counter with twenty pips, a one-link projection diagram and rope length readout at right; rope stretch as the caption graph. Motion: held out to the side and let go on the beat, the Token swings as a heavy pendulum on a chain that bows behind it. The anchor jerks right then left, and whip-waves run down the links. At 4 s the solver drops to one pass and the rope stretches like a bungee, bouncing the Token low; at 6 s it returns to twenty and the rope snaps taut, kicking the Token up. Then the anchor descends, the Token lands and stands, and the rope folds down onto the floor and settles. Signature moves: verlet integration (position + previous position), distance-constraint relaxation, n passes per step, kinematic anchor, heavy end mass, floor friction; transitions: a release, kinematic yanks, and a solver setting switched on the beat. In the tradition of Hitman: Codename 47 (IO Interactive, 2000; Verlet ragdolls) · Cut the Rope (ZeptoLab, 2010) · Half-Life 2 (Valve, 2004; physics ropes and cables). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ROPE". Punchy sound design synced to every cut.
```
