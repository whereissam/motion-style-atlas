# Motion Blur

*Many instants averaged across the open shutter · 1984 — · Technique Atlas*

Reference film: `videos/techmotionblur.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Motion Blur** (Many instants averaged across the open shutter, 1984 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A film camera’s rotary shutter is open for part of each frame — 180° is the classic setting, half the frame time — so anything that moves smears across the exposure. Computer graphics had to fake it: Korein and Badler and Potmesil and Chakravarty published temporal antialiasing methods in 1983, and Cook, Porter and Carpenter’s Distributed Ray Tracing (SIGGRAPH 1984) sampled time across the shutter, shown in the still 1984 by Thomas Porter at Lucasfilm’s Computer Graphics division (later Pixar). Ray Harryhausen’s stop-motion lacked blur and strobed; Industrial Light & Magic’s go-motion for Dragonslayer (1981) moved the puppets during exposure to put it back.
- Study these reference works: 1984 (Thomas Porter, Lucasfilm Computer Graphics, 1984; distributed ray tracing still) · Dragonslayer (Matthew Robbins, 1981; ILM go-motion) · Saving Private Ryan (Steven Spielberg, 1998; narrow 45° and 90° shutter)
- Motion DNA: The motion itself never changes — one swing every two beats, a steady 2.2 turns a second — only the exposure does. At 0° the Token is a crisp cut-out that jumps from frame to frame; at 90° and 180° it grows soft trailing edges, and the hole twists into an arc; at 360° the smear is a full frame long and four samples break it into visible copies until twenty-four melt them into a streak. When it slows to a stop the blur shrinks with its speed and leaves a sharp Token.
- Visual DNA: The Technique Atlas stage with the Token swinging along a ticked track; a rotary-shutter disc whose open sector widens and narrows, an exposure timeline with sample dots per frame, speed and blur-length readouts; two thin lanes underneath with ghosted previous frames — separate strobing copies at 0°, continuous streaks at 180°.
- Signature transitions: Shutter angle cut on the bar: 0°, 90°, 180°, 360° undersampled, 360°, 180°; a deceleration to stillness
- Key techniques: Shutter angle sets the exposure window, N sub-frame samples, averaged, Strobing at 0°, streaks at 180°–360°

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Shutter angle sets the exposure window, N sub-frame samples, averaged, Strobing at 0°, streaks at 180°–360°).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Shutter angle sets the exposure window and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MOTION BLUR", held for about 1 s.

BUILD RULES
- Suggested tools: Rotary shutter angle on film and digital cinema cameras, After Effects / Nuke motion blur (shutter angle, phase, samples per frame); renderer time sampling, Canvas 2D: N sub-frame Token renders averaged with lighter at 1/N alpha. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Motion Blur motion-graphics film (Many instants averaged across the open shutter). Visual style: the Technique Atlas stage with the Token swinging along a ticked track; a rotary-shutter disc whose open sector widens and narrows, an exposure timeline with sample dots per frame, speed and blur-length readouts; two thin lanes underneath with ghosted previous frames — separate strobing copies at 0°, continuous streaks at 180°. Motion: the motion itself never changes — one swing every two beats, a steady 2.2 turns a second — only the exposure does. At 0° the Token is a crisp cut-out that jumps from frame to frame; at 90° and 180° it grows soft trailing edges, and the hole twists into an arc; at 360° the smear is a full frame long and four samples break it into visible copies until twenty-four melt them into a streak. When it slows to a stop the blur shrinks with its speed and leaves a sharp Token. Signature moves: shutter angle sets the exposure window, n sub-frame samples, averaged, strobing at 0°, streaks at 180°–360°; transitions: shutter angle cut on the bar: 0°, 90°, 180°, 360° undersampled, 360°, 180°; a deceleration to stillness. In the tradition of 1984 (Thomas Porter, Lucasfilm Computer Graphics, 1984; distributed ray tracing still) · Dragonslayer (Matthew Robbins, 1981; ILM go-motion) · Saving Private Ryan (Steven Spielberg, 1998; narrow 45° and 90° shutter). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MOTION BLUR". Punchy sound design synced to every cut.
```
