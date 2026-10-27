# App UI Motion

*Micro-interactions & Product Shots · 2007 — · Social & Commercial*

Reference film: `videos/appui.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **App UI Motion** (Micro-interactions & Product Shots, 2007 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The iPhone (2007) made physics part of the interface: rubber-band scrolling, momentum and springs. Google’s Material Design (2014) codified ripples and shared-element transitions, Dribbble turned the looping product shot into a portfolio genre, and Apple’s Dynamic Island (2022) made a hardware cutout morph like a living object.
- Study these reference works: iPhone OS rubber-band scrolling (2007) · Google Material Design motion guidelines (2014) · Apple iOS 7 spring animations (2013) · Apple “Dynamic Island” (iPhone 14 Pro, 2022) · Dribbble UI animation shots · Airbnb Lottie (2017)
- Motion DNA: Everything answers the finger: presses dip, releases spring back with a little overshoot, lists cascade in 70 ms steps and elements carry their identity from one screen into the next.
- Visual DNA: A clean device on a pastel gradient, soft cards and pill shapes, one brand green with a lime accent, Inter type and a translucent touch indicator.
- Signature transitions: Iris open, push, shared-element morph, pull and spring back, button-to-loader morph, app closing into its icon.
- Key techniques: Damped springs (response, damping fraction) on every property, Shared-element morph of rect, radius, image and type size, Rubber-band pull with hold-and-release, Live spring-curve readout synced to each beat

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Damped springs (response, damping fraction) on every property, Shared-element morph of rect, radius, image and type size, Rubber-band pull with hold-and-release, Live spring-curve readout synced to each beat).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Damped springs (response, damping fraction) on every property and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "APP UI MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Figma Smart Animate, Principle / ProtoPie, After Effects + Lottie, SwiftUI / Jetpack Compose. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second App UI Motion motion-graphics film (Micro-interactions & Product Shots). Visual style: a clean device on a pastel gradient, soft cards and pill shapes, one brand green with a lime accent, Inter type and a translucent touch indicator. Motion: everything answers the finger: presses dip, releases spring back with a little overshoot, lists cascade in 70 ms steps and elements carry their identity from one screen into the next. Signature moves: damped springs (response, damping fraction) on every property, shared-element morph of rect, radius, image and type size, rubber-band pull with hold-and-release, live spring-curve readout synced to each beat; transitions: iris open, push, shared-element morph, pull and spring back, button-to-loader morph, app closing into its icon. In the tradition of iPhone OS rubber-band scrolling (2007) · Google Material Design motion guidelines (2014) · Apple iOS 7 spring animations (2013) · Apple “Dynamic Island” (iPhone 14 Pro, 2022) · Dribbble UI animation shots · Airbnb Lottie (2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "APP UI MOTION". Punchy sound design synced to every cut.
```
