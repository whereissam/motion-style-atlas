# Camera Shake

*Trauma in, noise out: the camera moves, the world does not · 1970s — · Technique Atlas*

Reference film: `videos/techshake.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Camera Shake** (Trauma in, noise out: the camera moves, the world does not, 1970s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Film crews shook the camera itself to sell explosions and earthquakes, and Clairmont Camera’s Image Shaker gave the move a dial for Saving Private Ryan (1998). Motion graphics made it a transform: After Effects users drive position and rotation with the wiggle() expression. Game developers formalised the feel — Jan Willem Nijman’s talk The Art of Screenshake (2013) and Squirrel Eiserloh’s GDC 2016 talk on juicing cameras, which set out trauma that decays, shake as trauma squared, and smooth noise instead of random jitter.
- Study these reference works: Saving Private Ryan (Steven Spielberg, 1998) · Nuclear Throne (Vlambeer, 2015) · Math for Game Programmers: Juicing Your Cameras With Math (Squirrel Eiserloh, GDC talk, 2016)
- Motion DNA: Nothing in the scene moves; only the camera does. Impacts land on the beat and fill the trauma meter, which drains in a straight line; the shake follows its square, so a light knock is a shiver and a heavy one a jolt that dies away smoothly. X, Y and roll each read their own noise at 9 Hz. For two and a half seconds the noise is swapped for a new random value every frame, and the same trauma turns into a nervous, frame-rate buzz.
- Visual DNA: The Technique Atlas stage as a fixed world with registration crosses; a 16:9 camera frame with orange corner brackets and a dashed action-safe area rides over it, its rest position dashed behind. A right-hand instrument column: the camera output inset, scrolling X/Y and roll graphs inside a dashed ±shake envelope, and trauma and trauma² meters.
- Signature transitions: Hits on the beat, smooth decay to stillness; a switch from smooth noise to per-frame jitter and back
- Key techniques: Trauma: add on impact, drain over time, Shake = trauma² × max, Smooth noise per channel, not random jitter

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Trauma: add on impact, drain over time, Shake = trauma² × max, Smooth noise per channel, not random jitter).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Trauma: add on impact, drain over time and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CAMERA SHAKE", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-held or shaker rigs on set; Image Shaker style mounts, After Effects wiggle() on position and rotation; game camera trauma systems, Canvas 2D: closed-form trauma decay, value noise per channel, inverse camera transform for the output. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Camera Shake motion-graphics film (Trauma in, noise out: the camera moves, the world does not). Visual style: the Technique Atlas stage as a fixed world with registration crosses; a 16:9 camera frame with orange corner brackets and a dashed action-safe area rides over it, its rest position dashed behind. A right-hand instrument column: the camera output inset, scrolling X/Y and roll graphs inside a dashed ±shake envelope, and trauma and trauma² meters. Motion: nothing in the scene moves; only the camera does. Impacts land on the beat and fill the trauma meter, which drains in a straight line; the shake follows its square, so a light knock is a shiver and a heavy one a jolt that dies away smoothly. X, Y and roll each read their own noise at 9 Hz. For two and a half seconds the noise is swapped for a new random value every frame, and the same trauma turns into a nervous, frame-rate buzz. Signature moves: trauma: add on impact, drain over time, shake = trauma² × max, smooth noise per channel, not random jitter; transitions: hits on the beat, smooth decay to stillness; a switch from smooth noise to per-frame jitter and back. In the tradition of Saving Private Ryan (Steven Spielberg, 1998) · Nuclear Throne (Vlambeer, 2015) · Math for Game Programmers: Juicing Your Cameras With Math (Squirrel Eiserloh, GDC talk, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CAMERA SHAKE". Punchy sound design synced to every cut.
```
