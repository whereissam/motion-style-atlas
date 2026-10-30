# Elastic

*Damped springs: overshoot and settle · 1930s — · Technique Atlas*

Reference film: `videos/techelastic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Elastic** (Damped springs: overshoot and settle, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Elastic timing comes from cel animation’s squash, stretch and follow-through — the principles Disney animators refined in the 1930s and Frank Thomas and Ollie Johnston set down in The Illusion of Life (1981). In code it became Robert Penner’s elastic and back easing equations (2001), and later physically based damped-spring animation, defined by stiffness and damping rather than duration, in libraries such as React Motion and Facebook’s Rebound and in Apple’s UIKit spring animations.
- Study these reference works: Robert Penner’s easing equations (Flash ActionScript, 2001) · iOS spring animations (UIKit, 2014) · React Motion and react-spring (JavaScript spring-physics libraries)
- Motion DNA: Every change of position, size and angle is driven by a damped harmonic oscillator released on the beat: the Token shoots past its target, swings back, and rings down to rest. Low damping rings long and wide, high damping lands almost dead; a linear-timed ghost arrives on time and stops cold beside it.
- Visual DNA: The Technique Atlas stage: warm paper ground with a faint 80 px grid, the orange rounded-square Token with an off-centre hole so its rotation reads, mono labels giving each spring’s frequency and damping ratio, dashed target lines, and the caption graph plotting the live spring curve.
- Signature transitions: Lane comparison fades to three springs on three beats; the three gather into one large Token with a sprung title
- Key techniques: Damped spring: frequency × damping ratio, Move, scale and rotate on springs, Linear ghost for contrast

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Damped spring: frequency × damping ratio, Move, scale and rotate on springs, Linear ghost for contrast).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Damped spring: frequency × damping ratio and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ELASTIC", held for about 1 s.

BUILD RULES
- Suggested tools: Closed-form damped spring 1 − e^(−ζωt)(cos ω_d t + …) evaluated per frame, Canvas 2D, Shared Technique Atlas kit and 120 BPM bed. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Elastic motion-graphics film (Damped springs: overshoot and settle). Visual style: the Technique Atlas stage: warm paper ground with a faint 80 px grid, the orange rounded-square Token with an off-centre hole so its rotation reads, mono labels giving each spring’s frequency and damping ratio, dashed target lines, and the caption graph plotting the live spring curve. Motion: every change of position, size and angle is driven by a damped harmonic oscillator released on the beat: the Token shoots past its target, swings back, and rings down to rest. Low damping rings long and wide, high damping lands almost dead; a linear-timed ghost arrives on time and stops cold beside it. Signature moves: damped spring: frequency × damping ratio, move, scale and rotate on springs, linear ghost for contrast; transitions: lane comparison fades to three springs on three beats; the three gather into one large Token with a sprung title. In the tradition of Robert Penner’s easing equations (Flash ActionScript, 2001) · iOS spring animations (UIKit, 2014) · React Motion and react-spring (JavaScript spring-physics libraries). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ELASTIC". Punchy sound design synced to every cut.
```
