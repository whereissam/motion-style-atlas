# Paint-on-Glass

*Living Oil Paint · 1970s — · Analog, Physical & Stop Motion*

Reference film: `videos/paintglass.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Paint-on-Glass** (Living Oil Paint, 1970s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Slow-drying oil paint is pushed around with fingers and brushes on a sheet of backlit glass and photographed one frame at a time; each frame is a repainting of the last, so images flow into each other. Aleksandr Petrov made it famous with The Old Man and the Sea (1999), which won the Academy Award.
- Study these reference works: The Street (Caroline Leaf, 1976) · The Cow (Aleksandr Petrov, 1989) · The Old Man and the Sea (Aleksandr Petrov, 1999) · My Love (Aleksandr Petrov, 2006) · Two Sisters (Caroline Leaf, 1990)
- Motion DNA: Nothing cuts: every image is wiped, smeared and repainted into the next, and the brushwork boils from frame to frame.
- Visual DNA: Thick directional strokes of luminous colour that follow the form, lit from behind so the thin paint glows like stained glass.
- Signature transitions: Swirl smear, palm wipe, repaint dissolve, stroke boil
- Key techniques: Directional oil strokes, Smear-morph transitions, Backlit glass glow

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Directional oil strokes, Smear-morph transitions, Backlit glass glow).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Directional oil strokes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PAINT-ON-GLASS", held for about 1 s.

BUILD RULES
- Suggested tools: Physical glass + camera, Canvas 2D, TVPaint. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Paint-on-Glass motion-graphics film (Living Oil Paint). Visual style: thick directional strokes of luminous colour that follow the form, lit from behind so the thin paint glows like stained glass. Motion: nothing cuts: every image is wiped, smeared and repainted into the next, and the brushwork boils from frame to frame. Signature moves: directional oil strokes, smear-morph transitions, backlit glass glow; transitions: swirl smear, palm wipe, repaint dissolve, stroke boil. In the tradition of The Street (Caroline Leaf, 1976) · The Cow (Aleksandr Petrov, 1989) · The Old Man and the Sea (Aleksandr Petrov, 1999) · My Love (Aleksandr Petrov, 2006) · Two Sisters (Caroline Leaf, 1990). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PAINT-ON-GLASS". Punchy sound design synced to every cut.
```
