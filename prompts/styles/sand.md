# Sand Animation

*Sand on a Light Table · 1969 — · Analog, Physical & Stop Motion*

Reference film: `videos/sand.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Sand Animation** (Sand on a Light Table, 1969 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Sand is pushed around on a backlit glass table and filmed frame by frame (or performed live), so every picture is wiped away to make the next. Caroline Leaf pioneered it at Harvard and the National Film Board of Canada.
- Study these reference works: Sand, or Peter and the Wolf (Caroline Leaf, 1969) · The Owl Who Married a Goose (Caroline Leaf, 1974) · Sandman (Eliot Noyes Jr., 1973) · Ab Ovo (Ferenc Cakó, 1987)
- Motion DNA: Continuous metamorphosis: one picture is swept, smeared and redrawn into the next without a single cut.
- Visual DNA: Grainy silhouettes on a warm glowing table, dark where sand is thick and luminous where fingers clear it.
- Signature transitions: Palm sweep, finger wipe, smear morph, carve-out reveal
- Key techniques: Backlit density: thin sand glows, Finger and palm sweeps, Metamorphosis without cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Backlit density: thin sand glows, Finger and palm sweeps, Metamorphosis without cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Backlit density: thin sand glows and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SAND ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Light table + overhead camera, Dragonframe, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Sand Animation motion-graphics film (Sand on a Light Table). Visual style: grainy silhouettes on a warm glowing table, dark where sand is thick and luminous where fingers clear it. Motion: continuous metamorphosis: one picture is swept, smeared and redrawn into the next without a single cut. Signature moves: backlit density: thin sand glows, finger and palm sweeps, metamorphosis without cuts; transitions: palm sweep, finger wipe, smear morph, carve-out reveal. In the tradition of Sand, or Peter and the Wolf (Caroline Leaf, 1969) · The Owl Who Married a Goose (Caroline Leaf, 1974) · Sandman (Eliot Noyes Jr., 1973) · Ab Ovo (Ferenc Cakó, 1987). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SAND ANIMATION". Punchy sound design synced to every cut.
```
