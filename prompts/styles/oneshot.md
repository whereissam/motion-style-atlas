# One-shot Camera Motion

*The Unbroken Take · 1958 — · Cinematic & Film Language*

Reference film: `videos/oneshot.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **One-shot Camera Motion** (The Unbroken Take, 1958 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A whole scene played as one continuous shot, with the camera craning, tracking and threading through doorways instead of cutting. Orson Welles opened Touch of Evil (1958) with a three-minute crane shot; the Steadicam (Garrett Brown, 1975) made Martin Scorsese's Copacabana walk in Goodfellas (1990) possible, and digital stitching let Alfonso Cuarón, Alejandro G. Iñárritu and Sam Mendes extend the illusion to whole sequences and films.
- Study these reference works: Touch of Evil (Orson Welles, 1958) · Goodfellas — Copacabana shot (Martin Scorsese, DP Michael Ballhaus, 1990) · Children of Men (Alfonso Cuarón, DP Emmanuel Lubezki, 2006) · Birdman (Alejandro G. Iñárritu, 2014) · 1917 (Sam Mendes, DP Roger Deakins, 2019)
- Motion DNA: One spline-smooth camera that never cuts: it cranes down, falls in behind its subjects, turns corners with them, floats through a tight kitchen aisle and finally rises and settles as the action resolves in front of it.
- Visual DNA: Anamorphic 2.39:1 frame, deep staging in real perspective, each room with its own light — sodium street, red corridor, green fluorescent kitchen, warm club — and the timecode running without a break.
- Signature transitions: None — doorways, a swinging door and the crane move do the work of cuts
- Key techniques: Crane-to-Steadicam move, Choreographed blocking ahead of camera, Doorway & window passes (hidden stitches), Continuous timecode, zero cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Crane-to-Steadicam move, Choreographed blocking ahead of camera, Doorway & window passes (hidden stitches), Continuous timecode, zero cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Crane-to-Steadicam move and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ONE-SHOT CAMERA MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Steadicam / crane / gimbal, Previs in Unreal or Blender, Canvas 2D (portal-ordered 3D projection). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural (needs choreography and rehearsal in live action).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second One-shot Camera Motion motion-graphics film (The Unbroken Take). Visual style: anamorphic 2.39:1 frame, deep staging in real perspective, each room with its own light — sodium street, red corridor, green fluorescent kitchen, warm club — and the timecode running without a break. Motion: one spline-smooth camera that never cuts: it cranes down, falls in behind its subjects, turns corners with them, floats through a tight kitchen aisle and finally rises and settles as the action resolves in front of it. Signature moves: crane-to-steadicam move, choreographed blocking ahead of camera, doorway & window passes (hidden stitches), continuous timecode, zero cuts; transitions: none — doorways, a swinging door and the crane move do the work of cuts. In the tradition of Touch of Evil (Orson Welles, 1958) · Goodfellas — Copacabana shot (Martin Scorsese, DP Michael Ballhaus, 1990) · Children of Men (Alfonso Cuarón, DP Emmanuel Lubezki, 2006) · Birdman (Alejandro G. Iñárritu, 2014) · 1917 (Sam Mendes, DP Roger Deakins, 2019). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ONE-SHOT CAMERA MOTION". Punchy sound design synced to every cut.
```
