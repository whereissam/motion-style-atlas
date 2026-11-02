# Inverse Kinematics

*Place the tip; the joints are solved · 1980s — · Technique Atlas*

Reference film: `videos/techik.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Inverse Kinematics** (Place the tip; the joints are solved, 1980s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Forward kinematics poses a chain joint by joint; inverse kinematics runs the other way, solving the joint angles that put the end of the chain on a goal. The maths came from robotics in the 1970s and 80s, and IK handles reached 3D animation packages by the early 1990s (Softimage was an early champion), along with the two-bone analytic solver still used for arms and legs. Iterative solvers handle longer chains: Cyclic Coordinate Descent (Wang and Chen, 1991) and FABRIK, Forward And Backward Reaching IK, published by Andreas Aristidou and Joan Lasenby in 2011.
- Study these reference works: Jurassic Park (Steven Spielberg, 1993; Softimage-animated dinosaurs) · Toy Story (Pixar, 1995) · Duik (Nicolas Dufresne; free IK rigging tools for After Effects character animation)
- Motion DNA: First the slow, fussy way: the shoulder is turned, then the elbow, overshooting and correcting until the tip finds the Token. Then the Token leads and the arm follows instantly — down, out past its reach until it locks straight and points, back in, and a swivel that flips the elbow to the other side without moving the tip. Finally a three-bone arm solves on the beat, one iteration per beat, snapping closer each time, then tracks the Token smoothly.
- Visual DNA: The Technique Atlas stage with a rigging-viewport arm: octahedral bones in paper and ink, ink joint discs, a crosshair end effector and a hatched mount; the orange Token as the goal; orange angle arcs, blue hand-rotation gizmos, a dashed reach circle; dashed ghost chains and an error list for each FABRIK iteration.
- Signature transitions: FK → two-bone IK at 2.8 s; elbow swivel at 5.25 s; re-rig to three bones and FABRIK at 6.3 s
- Key techniques: Two-bone law-of-cosines solve, Reach limit and bend (pole) flip, FABRIK forward / backward passes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Two-bone law-of-cosines solve, Reach limit and bend (pole) flip, FABRIK forward / backward passes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Two-bone law-of-cosines solve and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INVERSE KINEMATICS", held for about 1 s.

BUILD RULES
- Suggested tools: Maya IK handles: rotate-plane solver (two-bone) with a pole vector, FABRIK / CCD chain solvers in Unity, Unreal, Blender, Canvas 2D: analytic solve per frame; FABRIK iterations precomputed in setup(). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Inverse Kinematics motion-graphics film (Place the tip; the joints are solved). Visual style: the Technique Atlas stage with a rigging-viewport arm: octahedral bones in paper and ink, ink joint discs, a crosshair end effector and a hatched mount; the orange Token as the goal; orange angle arcs, blue hand-rotation gizmos, a dashed reach circle; dashed ghost chains and an error list for each FABRIK iteration. Motion: first the slow, fussy way: the shoulder is turned, then the elbow, overshooting and correcting until the tip finds the Token. Then the Token leads and the arm follows instantly — down, out past its reach until it locks straight and points, back in, and a swivel that flips the elbow to the other side without moving the tip. Finally a three-bone arm solves on the beat, one iteration per beat, snapping closer each time, then tracks the Token smoothly. Signature moves: two-bone law-of-cosines solve, reach limit and bend (pole) flip, fabrik forward / backward passes; transitions: fK → two-bone IK at 2.8 s; elbow swivel at 5.25 s; re-rig to three bones and FABRIK at 6.3 s. In the tradition of Jurassic Park (Steven Spielberg, 1993; Softimage-animated dinosaurs) · Toy Story (Pixar, 1995) · Duik (Nicolas Dufresne; free IK rigging tools for After Effects character animation). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INVERSE KINEMATICS". Punchy sound design synced to every cut.
```
