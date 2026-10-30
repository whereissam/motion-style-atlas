# Anticipation

*The wind-up before the action · 1930s — · Technique Atlas*

Reference film: `videos/techanticipation.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Anticipation** (The wind-up before the action, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Anticipation is one of the twelve basic principles of animation that Disney’s animators developed in the 1930s and Frank Thomas and Ollie Johnston described in The Illusion of Life (1981): a preparatory move in the opposite direction — a crouch before a jump, a pull-back before a dash — that tells the audience an action is coming. John Lasseter’s SIGGRAPH paper “Principles of Traditional Animation Applied to 3D Computer Animation” (1987) carried it into CG, and UI motion uses it as the overshooting “back” ease-in.
- Study these reference works: The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston, 1981) · Luxo Jr. (Pixar, John Lasseter, 1986) · The Road Runner cartoons’ wind-up-and-zip exits (Chuck Jones, Warner Bros.)
- Motion DNA: A beat of preparation in the opposite direction: the Token squashes down, leans back and slides away from where it is going, holds the coil for an instant, then releases into a stretched leap and lands with a small squash. Without it, the same leap starts from nothing and feels abrupt; with it, the take-off reads before it happens.
- Visual DNA: The Technique Atlas stage with its floor band, the orange Token, a dashed arc showing the path, outlined WITH / WITHOUT tags, dust puffs at take-off and landing, a tape-rewind marker, and a position/time curve whose dip below zero is the anticipation.
- Signature transitions: A rewind replays the first jump backwards; a pop-swap splits one Token into a side-by-side pair
- Key techniques: Crouch, lean-back and pull-back before take-off, Same jump with and without, Position curve dips before it rises

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Crouch, lean-back and pull-back before take-off, Same jump with and without, Position curve dips before it rises).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Crouch, lean-back and pull-back before take-off and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ANTICIPATION", held for about 1 s.

BUILD RULES
- Suggested tools: Keyframed crouch with eased hold, parabolic flight, landing squash, Canvas 2D, Shared Technique Atlas kit and 120 BPM bed. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Anticipation motion-graphics film (The wind-up before the action). Visual style: the Technique Atlas stage with its floor band, the orange Token, a dashed arc showing the path, outlined WITH / WITHOUT tags, dust puffs at take-off and landing, a tape-rewind marker, and a position/time curve whose dip below zero is the anticipation. Motion: a beat of preparation in the opposite direction: the Token squashes down, leans back and slides away from where it is going, holds the coil for an instant, then releases into a stretched leap and lands with a small squash. Without it, the same leap starts from nothing and feels abrupt; with it, the take-off reads before it happens. Signature moves: crouch, lean-back and pull-back before take-off, same jump with and without, position curve dips before it rises; transitions: a rewind replays the first jump backwards; a pop-swap splits one Token into a side-by-side pair. In the tradition of The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston, 1981) · Luxo Jr. (Pixar, John Lasseter, 1986) · The Road Runner cartoons’ wind-up-and-zip exits (Chuck Jones, Warner Bros.). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ANTICIPATION". Punchy sound design synced to every cut.
```
