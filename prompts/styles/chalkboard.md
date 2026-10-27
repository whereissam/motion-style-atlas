# Chalkboard Animation

*The Chalk Talk · 1900s — · 2D Animation & Illustration*

Reference film: `videos/chalkboard.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Chalkboard Animation** (The Chalk Talk, 1900s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Lecture-hall chalk talks became a screen style when explainer makers began filming, or faking, a hand drawing on slate: dusty strokes, an eraser that never quite cleans, and diagrams that start to move. Henry Reich’s MinutePhysics (2011) made the drawn-science explainer a web genre, and Ze Frank’s hand-scrawled lettering set its voice.
- Study these reference works: MinutePhysics (Henry Reich, 2011 —) · True Facts (Ze Frank, 2012 —) · Feynman Lectures on Physics, Caltech chalk talks (1961–63) · Good Will Hunting hallway blackboard (1997)
- Motion DNA: A chalk stick leads every stroke at handwriting speed, taps to punctuate, then a finished diagram suddenly moves on twos; a felt eraser scrubs in fast zigzags.
- Visual DNA: Dusty, broken white strokes on a dark green slate, cloudy with the half-erased ghosts of earlier lessons, then accents in yellow and pink chalk.
- Signature transitions: Eraser wipe, write-on, diagram release, colour-chalk highlight
- Key techniques: Hand-led chalk strokes, Dry-chalk grain coverage, Eraser ghosting, Diagram comes alive

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hand-led chalk strokes, Dry-chalk grain coverage, Eraser ghosting, Diagram comes alive).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hand-led chalk strokes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHALKBOARD ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (write-on + texture), Hand-drawn frames, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Chalkboard Animation motion-graphics film (The Chalk Talk). Visual style: dusty, broken white strokes on a dark green slate, cloudy with the half-erased ghosts of earlier lessons, then accents in yellow and pink chalk. Motion: a chalk stick leads every stroke at handwriting speed, taps to punctuate, then a finished diagram suddenly moves on twos; a felt eraser scrubs in fast zigzags. Signature moves: hand-led chalk strokes, dry-chalk grain coverage, eraser ghosting, diagram comes alive; transitions: eraser wipe, write-on, diagram release, colour-chalk highlight. In the tradition of MinutePhysics (Henry Reich, 2011 —) · True Facts (Ze Frank, 2012 —) · Feynman Lectures on Physics, Caltech chalk talks (1961–63) · Good Will Hunting hallway blackboard (1997). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHALKBOARD ANIMATION". Punchy sound design synced to every cut.
```
