# Guochao

*China Chic · 2018 — · Cultural & Regional*

Reference film: `videos/guochao.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Guochao** (China Chic, 2018 —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: When Li-Ning walked New York Fashion Week in 2018, traditional Chinese motifs became a modern visual language.
- Study these reference works: National Treasure (2017) · Yao-Chinese Folktales (2023)
- Motion DNA: Ink spreads, mountains rise in parallax layers, and the seal lands as the final percussive hit.
- Visual DNA: Vermilion, mineral blue, gold and ink; rice paper; moon-gate framing.
- Signature transitions: Ink bloom reveal, scroll unroll
- Key techniques: Ink bloom, Mountain parallax, Calligraphy & seal

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ink bloom, Mountain parallax, Calligraphy & seal).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ink bloom and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GUOCHAO", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Guochao motion-graphics film (China Chic). Visual style: vermilion, mineral blue, gold and ink; rice paper; moon-gate framing. Motion: ink spreads, mountains rise in parallax layers, and the seal lands as the final percussive hit. Signature moves: ink bloom, mountain parallax, calligraphy & seal; transitions: ink bloom reveal, scroll unroll. In the tradition of National Treasure (2017) · Yao-Chinese Folktales (2023). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GUOCHAO". Punchy sound design synced to every cut.
```
