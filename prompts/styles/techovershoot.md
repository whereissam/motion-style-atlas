# Overshoot

*One pass past the target, then settle · 1930s — · Technique Atlas*

Reference film: `videos/techovershoot.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Overshoot** (One pass past the target, then settle, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Disney animators taught overshoot as part of follow-through: a move carries past its final pose and eases back into it, so it reads as having weight and energy. In software it became the “back” easing curve — Robert Penner’s easing equations (2001) defined easeOutBack with its overshoot constant 1.70158, about a 10% overshoot — and that curve now ships in CSS cubic-bezier presets, GSAP’s back.out and nearly every animation library.
- Study these reference works: The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981; follow-through and overlapping action) · Robert Penner’s Easing Equations (Flash ActionScript, 2001) · GSAP back.out ease (GreenSock)
- Motion DNA: Every move takes one second: a fast start, a single excursion past the target, a turn and a soft settle — no second swing. Five lanes compare strengths from none (plain cubic ease-out) to s = 4 (about 38% past); they return on the next bar, overshooting the start mark; then the same curve drives a pop-in scale, a quarter-turn and a slide, with MOTION sliding in a beat behind.
- Visual DNA: The Technique Atlas stage; five lanes of small orange Tokens on thin tracks between dashed START and TARGET lines; dashed ghosts at each peak with a bracket and the measured overshoot; then one large Token with a dashed target outline, an angle arc with target and peak ticks, and target lines for the slide; all five curves faint in the caption graph with the active one in ink.
- Signature transitions: Lane race into a hero Token; overshoot on scale, rotation and position
- Key techniques: Ease-out-back curve, Overshoot strength s, Single pass, no oscillation

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ease-out-back curve, Overshoot strength s, Single pass, no oscillation).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ease-out-back curve and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OVERSHOOT", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects graph editor / Flow presets with back easing, CSS cubic-bezier(0.34, 1.56, 0.64, 1) · GSAP back.out(s), Canvas 2D: f(u) = 1 + (s+1)(u−1)³ + s(u−1)², peak at u = 1 − 2s / 3(s+1). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Overshoot motion-graphics film (One pass past the target, then settle). Visual style: the Technique Atlas stage; five lanes of small orange Tokens on thin tracks between dashed START and TARGET lines; dashed ghosts at each peak with a bracket and the measured overshoot; then one large Token with a dashed target outline, an angle arc with target and peak ticks, and target lines for the slide; all five curves faint in the caption graph with the active one in ink. Motion: every move takes one second: a fast start, a single excursion past the target, a turn and a soft settle — no second swing. Five lanes compare strengths from none (plain cubic ease-out) to s = 4 (about 38% past); they return on the next bar, overshooting the start mark; then the same curve drives a pop-in scale, a quarter-turn and a slide, with MOTION sliding in a beat behind. Signature moves: ease-out-back curve, overshoot strength s, single pass, no oscillation; transitions: lane race into a hero Token; overshoot on scale, rotation and position. In the tradition of The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981; follow-through and overlapping action) · Robert Penner’s Easing Equations (Flash ActionScript, 2001) · GSAP back.out ease (GreenSock). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OVERSHOOT". Punchy sound design synced to every cut.
```
