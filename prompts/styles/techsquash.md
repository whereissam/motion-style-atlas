# Squash & Stretch

*Deform with the motion, keep the volume · 1930s — · Technique Atlas*

Reference film: `videos/techsquash.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Squash & Stretch** (Deform with the motion, keep the volume, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Disney’s animators of the early 1930s found that drawings read as alive when a body stretched in fast motion and squashed on impact, provided it never seemed to gain or lose bulk. Frank Thomas and Ollie Johnston put it first of the twelve principles in The Illusion of Life (1981), illustrated by the half-filled flour sack that slumps, stretches and folds without changing its volume. John Lasseter carried it into computer animation in his SIGGRAPH paper Principles of Traditional Animation Applied to 3D Computer Animation (1987), and in software it is a scale with x and y set to reciprocals.
- Study these reference works: The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981; the flour-sack drawings) · Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter, SIGGRAPH 1987) · Snow White and the Seven Dwarfs (Walt Disney Productions, 1937)
- Motion DNA: Hops on the beat with gravity arcs. In flight the Token stretches in proportion to its speed along the direction of travel, so the axis tilts over the arc and the shape is rounder at the apex; on the contact frames it is planted and squashes flat and wide, then springs out stretched the other way. A rigid twin keeps the same timing and reads as stone. Then three drops compare restraint, excess and a squash that loses volume.
- Visual DNA: The Technique Atlas stage with its floor band split down the middle; the orange Token with a dashed undeformed outline and a velocity arrow on the left, a darker rigid Token on the right; readout boxes with a deformed unit square, long and short axis scales and the area; three columns for the extremes; scale-x and scale-y curves in the caption.
- Signature transitions: Side-by-side comparison into three columns dropped on the same beat
- Key techniques: Stretch along the velocity vector, Squash on contact, Area-preserving scale, sx·sy = 1

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Stretch along the velocity vector, Squash on contact, Area-preserving scale, sx·sy = 1).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Stretch along the velocity vector and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SQUASH & STRETCH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects scale with linked reciprocal X/Y (expressions) or a squash-and-stretch rig, Spine, Rive and Maya squash deformers that preserve volume, Canvas 2D: R(θ)·diag(s, 1/s)·R(−θ) applied with transform(), θ from the velocity. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Squash & Stretch motion-graphics film (Deform with the motion, keep the volume). Visual style: the Technique Atlas stage with its floor band split down the middle; the orange Token with a dashed undeformed outline and a velocity arrow on the left, a darker rigid Token on the right; readout boxes with a deformed unit square, long and short axis scales and the area; three columns for the extremes; scale-x and scale-y curves in the caption. Motion: hops on the beat with gravity arcs. In flight the Token stretches in proportion to its speed along the direction of travel, so the axis tilts over the arc and the shape is rounder at the apex; on the contact frames it is planted and squashes flat and wide, then springs out stretched the other way. A rigid twin keeps the same timing and reads as stone. Then three drops compare restraint, excess and a squash that loses volume. Signature moves: stretch along the velocity vector, squash on contact, area-preserving scale, sx·sy = 1; transitions: side-by-side comparison into three columns dropped on the same beat. In the tradition of The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981; the flour-sack drawings) · Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter, SIGGRAPH 1987) · Snow White and the Seven Dwarfs (Walt Disney Productions, 1937). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SQUASH & STRETCH". Punchy sound design synced to every cut.
```
