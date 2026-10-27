# Tilt-shift Miniature

*Miniature Faking · 2000s — · Cinematic & Film Language*

Reference film: `videos/tiltshift.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Tilt-shift Miniature** (Miniature Faking, 2000s —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Tilting a lens against the film plane (the Scheimpflug principle) lets photographers squeeze the plane of focus into a thin band. Shot from high above, that shallow focus mimics a macro lens over a model, so real cities read as toys; Olivo Barbieri's site specific series and Keith Loutit's stepped time-lapses made it a recognised genre in the 2000s.
- Study these reference works: Olivo Barbieri, site specific_ (2003 —) · Vincent Laforet, Tilt & Shift series (2006) · Keith Loutit, Bathtub series (2008 —) · Sam O'Hare, The Sandpit (2010) · Little Big Berlin (Christopher Häusler, 2012) · Joel Meyerowitz / Ben Thomas, Tiny Tokyo (2011)
- Motion DNA: A high locked-off view where everything below hops along in stepped time-lapse: cars, crowds, a turning ferris wheel and a ferry, while the band of focus racks in and slides across the town to pick out details.
- Visual DNA: Model-railway colours, a thin razor-sharp band through the middle of the frame with heavy graduated blur above and below, crisp miniature shadows, tiny dot people and a warm toy grade.
- Signature transitions: Rack focus in, focus-band slides (up, down, centre), time-lapse acceleration, title set into the focus band.
- Key techniques: True perspective town with painter-sorted boxes, gable roofs and cast shadows, Halving blur pyramid composited by distance from a focus band, Stepped 12 fps motion on a time-lapse clock that races at the climax, Saturated toy palette, tiny people, ferris wheel and harbour

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (True perspective town with painter-sorted boxes, gable roofs and cast shadows, Halving blur pyramid composited by distance from a focus band, Stepped 12 fps motion on a time-lapse clock that races at the climax, Saturated toy palette, tiny people, ferris wheel and harbour).
- 5.0–8.0 s  Climax: the most spectacular moment, built on True perspective town with painter-sorted boxes, gable roofs and cast shadows and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TILT-SHIFT MINIATURE", held for about 1 s.

BUILD RULES
- Suggested tools: Tilt-shift lens, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Tilt-shift Miniature motion-graphics film (Miniature Faking). Visual style: model-railway colours, a thin razor-sharp band through the middle of the frame with heavy graduated blur above and below, crisp miniature shadows, tiny dot people and a warm toy grade. Motion: a high locked-off view where everything below hops along in stepped time-lapse: cars, crowds, a turning ferris wheel and a ferry, while the band of focus racks in and slides across the town to pick out details. Signature moves: true perspective town with painter-sorted boxes, gable roofs and cast shadows, halving blur pyramid composited by distance from a focus band, stepped 12 fps motion on a time-lapse clock that races at the climax, saturated toy palette, tiny people, ferris wheel and harbour; transitions: rack focus in, focus-band slides (up, down, centre), time-lapse acceleration, title set into the focus band. In the tradition of Olivo Barbieri, site specific_ (2003 —) · Vincent Laforet, Tilt & Shift series (2006) · Keith Loutit, Bathtub series (2008 —) · Sam O'Hare, The Sandpit (2010) · Little Big Berlin (Christopher Häusler, 2012) · Joel Meyerowitz / Ben Thomas, Tiny Tokyo (2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TILT-SHIFT MINIATURE". Punchy sound design synced to every cut.
```
