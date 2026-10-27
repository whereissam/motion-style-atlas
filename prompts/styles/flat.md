# Flat Explainer

*Material Motion · 2013 — · 2D Animation & Illustration*

Reference film: `videos/flat.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Flat Explainer** (Material Motion, 2013 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Disney's twelve principles, flattened. Material Design made meaningful motion a written spec.
- Study these reference works: Kurzgesagt (2013 —) · Google Material Design (2014)
- Motion DNA: Springs with overshoot; one shape morphs into the next so every shot is connected.
- Visual DNA: Flat colour, rounded geometry, no outlines, bright harmonious palette.
- Signature transitions: Shape morph, ripple-out, fold-in to logo
- Key techniques: Squash & stretch, Overshoot, Shape morphing

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Squash & stretch, Overshoot, Shape morphing).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Squash & stretch and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FLAT EXPLAINER", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Lottie, Rive, CSS. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Flat Explainer motion-graphics film (Material Motion). Visual style: flat colour, rounded geometry, no outlines, bright harmonious palette. Motion: springs with overshoot; one shape morphs into the next so every shot is connected. Signature moves: squash & stretch, overshoot, shape morphing; transitions: shape morph, ripple-out, fold-in to logo. In the tradition of Kurzgesagt (2013 —) · Google Material Design (2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FLAT EXPLAINER". Punchy sound design synced to every cut.
```
