# Data Art

*A dataset as raw material for form · 2005 — · Experimental & Generative*

Reference film: `videos/datagen.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Data Art** (A dataset as raw material for form, 2005 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Data art treats a dataset as material rather than evidence: the same numbers are re-mapped until their structure becomes something to look at, not a point to be argued. Aaron Koblin's Flight Patterns (2005) drew a day of FAA flight tracks as glowing arcs; Ryoji Ikeda's datamatics (from 2006) pushed raw data into stark black-and-white matrices and barcodes at the edge of perception; Nicholas Felton's annual reports set a year of one life as typographic charts; and Refik Anadol's Machine Hallucinations (from 2019) turn huge image archives into fluid, pigment-like data sculptures.
- Study these reference works: Aaron Koblin — Flight Patterns (2005) · Ryoji Ikeda — datamatics (2006–) and test pattern (2008–) · Nicholas Felton — The Feltron Annual Reports (2005–2014) · Refik Anadol — Machine Hallucinations (2019–)
- Motion DNA: Nothing is keyframed by hand: every one of 8,760 readings is a point that travels its own arc between layouts the data defines — a scrolling matrix, a calendar, a ring, a rotating sculpture — so the structure of the year (seasons, weekends, rush hours) appears, dissolves and reappears in each form.
- Visual DNA: Absolute black, white hairlines and tiny monospaced readouts in Ikeda's manner; a diverging blue-to-red temperature calendar; a mint demand ring; and an additive magenta, violet and gold point cloud that glows where the data is dense.
- Signature transitions: Matrix stops scrolling, readings fly to the calendar, fold into the ring, then rise into the sculpture as the title lands
- Key techniques: Synthetic hourly dataset, Per-point form morphing, Point-cloud data sculpture

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Synthetic hourly dataset, Per-point form morphing, Point-cloud data sculpture).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Synthetic hourly dataset and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DATA ART", held for about 1 s.

BUILD RULES
- Suggested tools: Processing / openFrameworks, TouchDesigner / Houdini point clouds, D3 + WebGL, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Data Art motion-graphics film (A dataset as raw material for form). Visual style: absolute black, white hairlines and tiny monospaced readouts in Ikeda's manner; a diverging blue-to-red temperature calendar; a mint demand ring; and an additive magenta, violet and gold point cloud that glows where the data is dense. Motion: nothing is keyframed by hand: every one of 8,760 readings is a point that travels its own arc between layouts the data defines — a scrolling matrix, a calendar, a ring, a rotating sculpture — so the structure of the year (seasons, weekends, rush hours) appears, dissolves and reappears in each form. Signature moves: synthetic hourly dataset, per-point form morphing, point-cloud data sculpture; transitions: matrix stops scrolling, readings fly to the calendar, fold into the ring, then rise into the sculpture as the title lands. In the tradition of Aaron Koblin — Flight Patterns (2005) · Ryoji Ikeda — datamatics (2006–) and test pattern (2008–) · Nicholas Felton — The Feltron Annual Reports (2005–2014) · Refik Anadol — Machine Hallucinations (2019–). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DATA ART". Punchy sound design synced to every cut.
```
