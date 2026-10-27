# Whiteboard

*Draw-along Explainer · 2010 — · 2D Animation & Illustration*

Reference film: `videos/whiteboard.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Whiteboard** (Draw-along Explainer, 2010 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: RSA Animate drew lectures live on a whiteboard, sparking a wave of hand-drawn explainer videos.
- Study these reference works: RSA Animate (2010 —)
- Motion DNA: A hand leads every stroke in sync with narration; the camera pans to follow and pulls out at the end.
- Visual DNA: Black marker on white, one or two accent colours, handwritten headlines.
- Signature transitions: Pan-to-next idea, pull-out reveal
- Key techniques: Hand-led strokes, Doodle icons, Mind-map build

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Hand-led strokes, Doodle icons, Mind-map build).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Hand-led strokes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WHITEBOARD", held for about 1 s.

BUILD RULES
- Suggested tools: VideoScribe, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Whiteboard motion-graphics film (Draw-along Explainer). Visual style: black marker on white, one or two accent colours, handwritten headlines. Motion: a hand leads every stroke in sync with narration; the camera pans to follow and pulls out at the end. Signature moves: hand-led strokes, doodle icons, mind-map build; transitions: pan-to-next idea, pull-out reveal. In the tradition of RSA Animate (2010 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WHITEBOARD". Punchy sound design synced to every cut.
```
