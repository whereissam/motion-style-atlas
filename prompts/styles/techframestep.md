# Frame Stepping

*Ones, twos, fours: sampling motion and holding it · 1910s — · Technique Atlas*

Reference film: `videos/techframestep.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Frame Stepping** (Ones, twos, fours: sampling motion and holding it, 1910s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Drawn animation has been shot on twos — each drawing held for two frames — since the silent era, halving the drawings for movement that still reads; fast action goes to ones, and the limited animation of 1950s and 60s television leaned on threes, fours and long holds. Stop motion such as Willis O’Brien’s work on King Kong (1933) carries the same stepped look, with every pose placed by hand. Digital tools made it a setting: After Effects’ Posterize Time effect and posterizeTime() expression resample any smooth animation to a lower rate, and Spider-Man: Into the Spider-Verse (2018) mixed ones and twos on purpose.
- Study these reference works: King Kong (Merian C. Cooper and Ernest B. Schoedsack, 1933; stop motion by Willis O’Brien) · The Lego Movie (Phil Lord and Christopher Miller, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018)
- Motion DNA: One curve, four clocks: a bar-long ease across and back with a full turn, identical in every lane but redrawn every frame, every second, every fourth and every fifth frame — so the same ease reads as fluid, crisp, choppy and stuttering. The holds lag the smooth ghost and jump to catch up, biggest jumps in the middle of the ease. Then a 6 fps stop-motion run of rolls and hops that never sits quite still between poses, and a word set letter by letter on the same clock.
- Visual DNA: The Technique Atlas stage split into four labelled lanes, small orange Tokens on thin tracks, dashed outline ghosts at the ones position; hold strips of twelve frame cells, repeated drawings merged into blocks numbered by drawing, the current one orange; then a floor, a large Token, dashed onion skins and a drawing counter; the held-time staircase as the caption graph.
- Signature transitions: Lanes enter on the beat and clear together; a cut to the single stop-motion Token; letters appear on the held clock
- Key techniques: Sample and hold: t → floor(t · fps) / fps, Ones · twos · fours · posterised 6 fps, Pose jitter for a hand-placed feel

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Sample and hold: t → floor(t · fps) / fps, Ones · twos · fours · posterised 6 fps, Pose jitter for a hand-placed feel).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Sample and hold: t → floor(t · fps) / fps and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FRAME STEPPING", held for about 1 s.

BUILD RULES
- Suggested tools: Exposure sheets: ones, twos, threes, holds, After Effects Posterize Time / posterizeTime(fps); Blender Stepped Interpolation modifier, Canvas 2D: the time fed to the pose is floor(t · fps) / fps; jitter seeded by drawing number. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Frame Stepping motion-graphics film (Ones, twos, fours: sampling motion and holding it). Visual style: the Technique Atlas stage split into four labelled lanes, small orange Tokens on thin tracks, dashed outline ghosts at the ones position; hold strips of twelve frame cells, repeated drawings merged into blocks numbered by drawing, the current one orange; then a floor, a large Token, dashed onion skins and a drawing counter; the held-time staircase as the caption graph. Motion: one curve, four clocks: a bar-long ease across and back with a full turn, identical in every lane but redrawn every frame, every second, every fourth and every fifth frame — so the same ease reads as fluid, crisp, choppy and stuttering. The holds lag the smooth ghost and jump to catch up, biggest jumps in the middle of the ease. Then a 6 fps stop-motion run of rolls and hops that never sits quite still between poses, and a word set letter by letter on the same clock. Signature moves: sample and hold: t → floor(t · fps) / fps, ones · twos · fours · posterised 6 fps, pose jitter for a hand-placed feel; transitions: lanes enter on the beat and clear together; a cut to the single stop-motion Token; letters appear on the held clock. In the tradition of King Kong (Merian C. Cooper and Ernest B. Schoedsack, 1933; stop motion by Willis O’Brien) · The Lego Movie (Phil Lord and Christopher Miller, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FRAME STEPPING". Punchy sound design synced to every cut.
```
