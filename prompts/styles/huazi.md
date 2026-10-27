# Variety Captions

*Huazi · 2013 — · Social & Commercial*

Reference film: `videos/huazi.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Variety Captions** (Huazi, 2013 —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Borrowed from Japanese and Korean variety-show telops, then standard on Chinese reality TV.
- Study these reference works: Dad, Where Are We Going? (2013) · Running Man China (2014)
- Motion DNA: Every caption pops on a spring with an exact sound effect; the camera shakes on the punchline.
- Visual DNA: Chunky rounded type with stacked outlines, gradients, stickers and speed lines.
- Signature transitions: Desaturated "awkward silence", stamp-in
- Key techniques: Layered outlines, Elastic pop-in, SFX sync

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Layered outlines, Elastic pop-in, SFX sync).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Layered outlines and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VARIETY CAPTIONS", held for about 1 s.

BUILD RULES
- Suggested tools: Premiere, CapCut, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural over live footage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Variety Captions motion-graphics film (Huazi). Visual style: chunky rounded type with stacked outlines, gradients, stickers and speed lines. Motion: every caption pops on a spring with an exact sound effect; the camera shakes on the punchline. Signature moves: layered outlines, elastic pop-in, sfx sync; transitions: desaturated "awkward silence", stamp-in. In the tradition of Dad, Where Are We Going? (2013) · Running Man China (2014). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VARIETY CAPTIONS". Punchy sound design synced to every cut.
```
