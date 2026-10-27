# Scrapbook Journal

*Shouzhang · 2019 — · Social & Commercial*

Reference film: `videos/shouzhang.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Scrapbook Journal** (Shouzhang, 2019 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Japanese techō journaling meets stop motion: the cosy vlog look of Xiaohongshu and Bilibili.
- Study these reference works: Hobonichi Techo · Traveler's Notebook · journal vlogs
- Motion DNA: Everything steps at 12 fps with per-frame jitter, as if placed by hand.
- Visual DNA: Dot-grid paper, washi tape, polaroids, handwriting, warm desk light.
- Signature transitions: Tape slap, stamp thump
- Key techniques: 12 fps boil, Washi tape, Handwriting reveal

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (12 fps boil, Washi tape, Handwriting reveal).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 12 fps boil and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SCRAPBOOK JOURNAL", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Procreate, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural + hand-drawn.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Scrapbook Journal motion-graphics film (Shouzhang). Visual style: dot-grid paper, washi tape, polaroids, handwriting, warm desk light. Motion: everything steps at 12 fps with per-frame jitter, as if placed by hand. Signature moves: 12 fps boil, washi tape, handwriting reveal; transitions: tape slap, stamp thump. In the tradition of Hobonichi Techo · Traveler's Notebook · journal vlogs. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SCRAPBOOK JOURNAL". Punchy sound design synced to every cut.
```
