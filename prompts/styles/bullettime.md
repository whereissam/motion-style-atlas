# Bullet Time

*Frozen time, moving camera · 1995 — · Cinematic & Film Language*

Reference film: `videos/bullettime.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Bullet Time** (Frozen time, moving camera, 1995 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Bullet time stops or nearly stops a moment of action while the camera keeps moving through it, so the audience can circle a bullet in flight. Michel Gondry staged camera-array shots in the Rolling Stones’ “Like a Rolling Stone” video (1995) and a Smirnoff commercial (1996), after Tim Macmillan’s time-slice experiments; The Matrix (1999), with John Gaeta as visual effects supervisor, fired an arc of still cameras in sequence, filled the gaps with interpolated frames and virtual backgrounds, and made the term famous.
- Study these reference works: Like a Rolling Stone, The Rolling Stones (music video, Michel Gondry, 1995) · Smirnoff commercial (Michel Gondry, 1996) · The Matrix (Lana & Lilly Wachowski, 1999; visual effects supervisor John Gaeta) · Max Payne (Remedy Entertainment, 2001, game) · The Matrix Reloaded (Wachowskis, 2003)
- Motion DNA: Real-time action ramps down to a crawl in a second; then nothing moves but the camera, which sweeps more than half a circle around the frozen subject on one smooth eased arc. Bullets creep forward a few centimetres, rain hangs as beads. Time snaps back to full speed with a jolt and everything that was suspended completes its motion at once.
- Visual DNA: A green-tinted overcast rooftop, a figure in a long black coat and dark glasses bent backward almost flat, brass slugs dragging rings of rippled air, suspended raindrops, a splash crown and concrete chips, a skyline that wheels past behind; a 2.39:1 letterbox carrying a camera-array counter and a speed readout.
- Signature transitions: Speed ramp into a freeze, a continuous virtual-camera orbit, snap back to real time with a single light flash
- Key techniques: Camera orbit, clock stopped, Ripple-ring bullet wakes, Speed ramp and snap-back

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Camera orbit, clock stopped, Ripple-ring bullet wakes, Speed ramp and snap-back).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Camera orbit, clock stopped and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BULLET TIME", held for about 1 s.

BUILD RULES
- Suggested tools: An arc of still cameras triggered in sequence, plus interpolated frames and virtual backgrounds, Pseudo-3D projection in Canvas 2D with a depth-sorted scene, Action clock integrated from a speed curve. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural homage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Bullet Time motion-graphics film (Frozen time, moving camera). Visual style: a green-tinted overcast rooftop, a figure in a long black coat and dark glasses bent backward almost flat, brass slugs dragging rings of rippled air, suspended raindrops, a splash crown and concrete chips, a skyline that wheels past behind; a 2.39:1 letterbox carrying a camera-array counter and a speed readout. Motion: real-time action ramps down to a crawl in a second; then nothing moves but the camera, which sweeps more than half a circle around the frozen subject on one smooth eased arc. Bullets creep forward a few centimetres, rain hangs as beads. Time snaps back to full speed with a jolt and everything that was suspended completes its motion at once. Signature moves: camera orbit, clock stopped, ripple-ring bullet wakes, speed ramp and snap-back; transitions: speed ramp into a freeze, a continuous virtual-camera orbit, snap back to real time with a single light flash. In the tradition of Like a Rolling Stone, The Rolling Stones (music video, Michel Gondry, 1995) · Smirnoff commercial (Michel Gondry, 1996) · The Matrix (Lana & Lilly Wachowski, 1999; visual effects supervisor John Gaeta) · Max Payne (Remedy Entertainment, 2001, game) · The Matrix Reloaded (Wachowskis, 2003). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BULLET TIME". Punchy sound design synced to every cut.
```
