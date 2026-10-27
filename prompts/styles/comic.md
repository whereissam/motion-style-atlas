# Comic Book Motion

*Panels in Motion · 1930s — · 2D Animation & Illustration*

Reference film: `videos/comic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Comic Book Motion** (Panels in Motion, 1930s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Motion comics animate the printed page itself: panels, gutters, captions and balloons stay on screen while the camera travels between them. The look descends from four-colour newsprint — Ben-Day dots, slipping colour plates, onomatopoeia — and was rebuilt for cinema by Sony Pictures Animation in Spider-Man: Into the Spider-Verse (2018).
- Study these reference works: Batman (ABC TV series, 1966) · Whaam! (Roy Lichtenstein, 1963) · Watchmen Motion Comic (Warner Premiere, 2008) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Spider-Man: Across the Spider-Verse (2023)
- Motion DNA: Characters move on twos while the camera glides on ones, diving panel to panel with a pull-back-push-in, then a figure smashes through the panel border into a full-frame sound effect.
- Visual DNA: Four-colour newsprint: heavy black key line, flat CMY fills shaded with Ben-Day dots, plates slipping a few pixels out of register, yellow caption boxes and typed speech balloons.
- Signature transitions: Gutter dive, panel-border break, impact flash, page turn to cover
- Key techniques: Ben-Day halftone, CMYK misregistration, Animation on twos, Panel-to-panel camera

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ben-Day halftone, CMYK misregistration, Animation on twos, Panel-to-panel camera).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ben-Day halftone and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "COMIC BOOK MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Clip Studio Paint, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Comic Book Motion motion-graphics film (Panels in Motion). Visual style: four-colour newsprint: heavy black key line, flat CMY fills shaded with Ben-Day dots, plates slipping a few pixels out of register, yellow caption boxes and typed speech balloons. Motion: characters move on twos while the camera glides on ones, diving panel to panel with a pull-back-push-in, then a figure smashes through the panel border into a full-frame sound effect. Signature moves: ben-day halftone, cmyk misregistration, animation on twos, panel-to-panel camera; transitions: gutter dive, panel-border break, impact flash, page turn to cover. In the tradition of Batman (ABC TV series, 1966) · Whaam! (Roy Lichtenstein, 1963) · Watchmen Motion Comic (Warner Premiere, 2008) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Spider-Man: Across the Spider-Verse (2023). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "COMIC BOOK MOTION". Punchy sound design synced to every cut.
```
