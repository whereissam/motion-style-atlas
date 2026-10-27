# Science Explainer

*Kepu · 2019 — · Social & Commercial*

Reference film: `videos/kepu.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Science Explainer** (Kepu, 2019 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Bilibili's knowledge channels made data-driven flat explainers mainstream, inspired by Kurzgesagt.
- Study these reference works: Powers of Ten (1977) · PaperClip, "Everything about COVID-19" (2020)
- Motion DNA: Ask, zoom through scales, count, then compare on an honest scale.
- Visual DNA: Dark navy, flat illustration, mono numerals, callout leaders.
- Signature transitions: Magnifier zoom, number collapse
- Key techniques: Question hook, Powers-of-ten zoom, To-scale data

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Question hook, Powers-of-ten zoom, To-scale data).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Question hook and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SCIENCE EXPLAINER", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, D3, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Science Explainer motion-graphics film (Kepu). Visual style: dark navy, flat illustration, mono numerals, callout leaders. Motion: ask, zoom through scales, count, then compare on an honest scale. Signature moves: question hook, powers-of-ten zoom, to-scale data; transitions: magnifier zoom, number collapse. In the tradition of Powers of Ten (1977) · PaperClip, "Everything about COVID-19" (2020). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SCIENCE EXPLAINER". Punchy sound design synced to every cut.
```
