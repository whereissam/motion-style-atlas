# Futurism

*Speed, Noise and the Machine · 1909 — 1944 · Graphic Design & Historical*

Reference film: `videos/futurism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Futurism** (Speed, Noise and the Machine, 1909 — 1944; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Italian Futurism began with F. T. Marinetti’s founding manifesto on the front page of Le Figaro on 20 February 1909, which declared a roaring motor car more beautiful than the Victory of Samothrace. Painters and sculptors such as Giacomo Balla, Umberto Boccioni, Gino Severini and Carlo Carrà borrowed the multiple exposures of Marey’s and Muybridge’s chronophotography to paint motion itself, Luigi Russolo built noise machines, and Marinetti blew the printed page apart into words-in-freedom.
- Study these reference works: Manifesto of Futurism (F. T. Marinetti, Le Figaro, 1909) · Dynamism of a Dog on a Leash (Giacomo Balla, 1912) · Unique Forms of Continuity in Space (Umberto Boccioni, 1913) · The Art of Noises (Luigi Russolo, 1913) · Zang Tumb Tuuum (Marinetti, 1914)
- Motion DNA: Motion is shown as many instants at once: limbs fan into a dozen positions, a train drags a wake of its own earlier bodies, a striding figure leaves ghost copies, rays and arcs speed up with the subject, and words fly in on diagonals and land with a jolt.
- Visual DNA: Cream paper splintered by translucent orange, ochre and steel-blue planes and black-and-red force lines; dark machine silhouettes, burnished bronze, and a typographic free-for-all of condensed grotesques, Bodoni italics and typewriter capitals at every size and angle.
- Signature transitions: Needle-bundle wipe, train rush-through, figure stride-in, word slams from every side, black diagonal title band
- Key techniques: Chronophotographic echoes, Force-line rays and planes, Words-in-freedom slams

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Chronophotographic echoes, Force-line rays and planes, Words-in-freedom slams).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Chronophotographic echoes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FUTURISM", held for about 1 s.

BUILD RULES
- Suggested tools: Oil on canvas, bronze and letterpress, After Effects echo and directional blur, Canvas 2D (time-offset re-draws). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Futurism motion-graphics film (Speed, Noise and the Machine). Visual style: cream paper splintered by translucent orange, ochre and steel-blue planes and black-and-red force lines; dark machine silhouettes, burnished bronze, and a typographic free-for-all of condensed grotesques, Bodoni italics and typewriter capitals at every size and angle. Motion: motion is shown as many instants at once: limbs fan into a dozen positions, a train drags a wake of its own earlier bodies, a striding figure leaves ghost copies, rays and arcs speed up with the subject, and words fly in on diagonals and land with a jolt. Signature moves: chronophotographic echoes, force-line rays and planes, words-in-freedom slams; transitions: needle-bundle wipe, train rush-through, figure stride-in, word slams from every side, black diagonal title band. In the tradition of Manifesto of Futurism (F. T. Marinetti, Le Figaro, 1909) · Dynamism of a Dog on a Leash (Giacomo Balla, 1912) · Unique Forms of Continuity in Space (Umberto Boccioni, 1913) · The Art of Noises (Luigi Russolo, 1913) · Zang Tumb Tuuum (Marinetti, 1914). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FUTURISM". Punchy sound design synced to every cut.
```
