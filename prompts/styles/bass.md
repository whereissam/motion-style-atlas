# Cut-Paper Modernism

*After Saul Bass · 1955 — · Graphic Design & Historical*

Reference film: `videos/bass.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cut-Paper Modernism** (After Saul Bass, 1955 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Saul Bass turned title sequences from static cards into the opening act of the film: torn paper, bold silhouettes, jazz.
- Study these reference works: The Man with the Golden Arm (1955) · Vertigo (1958) · Psycho (1960)
- Motion DNA: Flat shapes enter on the beat with hard eases; one symbolic body part stands in for the whole story.
- Visual DNA: Two or three flat colours, torn edges, film grain, hand-cut condensed type.
- Signature transitions: Hard colour cut, slat split
- Key techniques: Rough-cut edges, Symbolic silhouettes, Hard colour cuts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Rough-cut edges, Symbolic silhouettes, Hard colour cuts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Rough-cut edges and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CUT-PAPER MODERNISM", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, SVG. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cut-Paper Modernism motion-graphics film (After Saul Bass). Visual style: two or three flat colours, torn edges, film grain, hand-cut condensed type. Motion: flat shapes enter on the beat with hard eases; one symbolic body part stands in for the whole story. Signature moves: rough-cut edges, symbolic silhouettes, hard colour cuts; transitions: hard colour cut, slat split. In the tradition of The Man with the Golden Arm (1955) · Vertigo (1958) · Psycho (1960). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CUT-PAPER MODERNISM". Punchy sound design synced to every cut.
```
