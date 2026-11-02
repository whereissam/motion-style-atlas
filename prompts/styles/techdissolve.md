# Dissolve

*One picture fades out as the next fades in · 1890s — · Technique Atlas*

Reference film: `videos/techdissolve.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dissolve** (One picture fades out as the next fades in, 1890s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The dissolve began in the camera: the operator faded a shot out with the shutter or iris, wound the film back and faded the next shot in over the same frames. Georges Méliès used dissolves to join the tableaux of Cinderella (Cendrillon, 1899); from the 1930s they were made on the optical printer, and Hollywood grammar settled on the dissolve for passing time and the fade to black for ending a scene. Editing software kept the vocabulary: Cross Dissolve, Dip to Black, Dip to White and an Additive Dissolve that sums the two pictures are standard transitions in Premiere Pro, and Avid and Final Cut have their own equivalents.
- Study these reference works: Cinderella / Cendrillon (Georges Méliès, 1899) · Psycho (Alfred Hitchcock, 1960; the dissolve from the shower drain to Marion’s eye) · Apocalypse Now (Francis Ford Coppola, 1979; the opening dissolves between Willard and the burning jungle)
- Motion DNA: Nothing moves: only opacity changes, on a linear ramp. Two seconds of cross-dissolve with a long, muddy middle where both shots are half there; a quicker dip through black that empties the frame for an instant before the next shot rises; a one-second dip through white; then a held comparison where a normal and an additive dissolve play the same cut side by side.
- Visual DNA: The Technique Atlas stage around a framed program monitor showing five Token shots (orange, blue, ink with the word, outline, orange with the word); layer-opacity bars and a probe crosshair with swatches for A, B and the mixed pixel on a side panel; then two monitors with formulas and paper-luma meters, the additive one flaring to white at the midpoint.
- Signature transitions: Cross-dissolve, dip to black, dip to white, normal and additive dissolve on the same cut
- Key techniques: Linear opacity mix, Dip to black / white, Additive vs. normal dissolve

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Linear opacity mix, Dip to black / white, Additive vs. normal dissolve).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Linear opacity mix and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DISSOLVE", held for about 1 s.

BUILD RULES
- Suggested tools: Premiere Pro Cross Dissolve / Dip to Black / Dip to White / Additive Dissolve, After Effects layer opacity keyframes · Avid and Final Cut dissolves, Canvas 2D: globalAlpha over the outgoing shot; globalCompositeOperation lighter on offscreen shots for the additive mix. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dissolve motion-graphics film (One picture fades out as the next fades in). Visual style: the Technique Atlas stage around a framed program monitor showing five Token shots (orange, blue, ink with the word, outline, orange with the word); layer-opacity bars and a probe crosshair with swatches for A, B and the mixed pixel on a side panel; then two monitors with formulas and paper-luma meters, the additive one flaring to white at the midpoint. Motion: nothing moves: only opacity changes, on a linear ramp. Two seconds of cross-dissolve with a long, muddy middle where both shots are half there; a quicker dip through black that empties the frame for an instant before the next shot rises; a one-second dip through white; then a held comparison where a normal and an additive dissolve play the same cut side by side. Signature moves: linear opacity mix, dip to black / white, additive vs. normal dissolve; transitions: cross-dissolve, dip to black, dip to white, normal and additive dissolve on the same cut. In the tradition of Cinderella / Cendrillon (Georges Méliès, 1899) · Psycho (Alfred Hitchcock, 1960; the dissolve from the shower drain to Marion’s eye) · Apocalypse Now (Francis Ford Coppola, 1979; the opening dissolves between Willard and the burning jungle). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DISSOLVE". Punchy sound design synced to every cut.
```
