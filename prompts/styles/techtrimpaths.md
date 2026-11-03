# Trim Paths

*Draw a stroke by trimming its start and end · 2007 — · Technique Atlas*

Reference film: `videos/techtrimpaths.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Trim Paths** (Draw a stroke by trimming its start and end, 2007 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Draw-on lines came first as effects that revealed a stroke along a path, such as After Effects’ Stroke and Write-on. Trim Paths arrived with After Effects shape layers in CS3 (2007): an operator that keeps only the part of a path between a start and an end percentage, with an offset that slides the window round and a choice of trimming several paths simultaneously or one after another. On the web the same idea runs on an SVG stroke’s dash array and dash offset, popularised for line-drawing animation around 2013, and Airbnb’s Lottie (2017) carried After Effects trim paths into apps.
- Study these reference works: Animated line drawing in SVG (Jake Archibald, 2013) · Lottie (Airbnb, 2017; After Effects trim paths played back in apps) · Lottie (Airbnb, 2017)
- Motion DNA: The outline draws on over a bar on an in-out ease and the fill drops in on the downbeat; a quarter-length segment then laps the Token twice at constant speed and grows back to a closed line. MOTION draws all nine strokes at once in one row and stroke after stroke in the next, so the same END curve reads as one gesture or as handwriting; six bursts fire on and off with START a fifth of a second behind END, the rows erase by START, and the word draws back on.
- Visual DNA: The Technique Atlas stage: the Token outlined in a thick round-capped ink stroke over its orange fill, faint dotted guides showing each untrimmed path, orange S and E markers at the trimmed ends; MOTION as monoline ink strokes in two rows labelled by mode; orange burst strokes round the Token; a right-hand panel with START, END and OFFSET sliders, the target, its length and visible length in pixels.
- Signature transitions: Draw-on and draw-off by trim; the offset chase wraps across the path’s start point
- Key techniques: Start · end · offset, Simultaneous vs individual, Arc-length sampled paths

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Start · end · offset, Simultaneous vs individual, Arc-length sampled paths).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Start · end · offset and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TRIM PATHS", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects shape layers: Trim Paths (start, end, offset; simultaneously / individually), SVG stroke-dasharray / stroke-dashoffset with getTotalLength(); Lottie trim paths, Canvas 2D: polylines sampled by arc length, sub-path stroked between start and end. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Trim Paths motion-graphics film (Draw a stroke by trimming its start and end). Visual style: the Technique Atlas stage: the Token outlined in a thick round-capped ink stroke over its orange fill, faint dotted guides showing each untrimmed path, orange S and E markers at the trimmed ends; MOTION as monoline ink strokes in two rows labelled by mode; orange burst strokes round the Token; a right-hand panel with START, END and OFFSET sliders, the target, its length and visible length in pixels. Motion: the outline draws on over a bar on an in-out ease and the fill drops in on the downbeat; a quarter-length segment then laps the Token twice at constant speed and grows back to a closed line. MOTION draws all nine strokes at once in one row and stroke after stroke in the next, so the same END curve reads as one gesture or as handwriting; six bursts fire on and off with START a fifth of a second behind END, the rows erase by START, and the word draws back on. Signature moves: start · end · offset, simultaneous vs individual, arc-length sampled paths; transitions: draw-on and draw-off by trim; the offset chase wraps across the path’s start point. In the tradition of Animated line drawing in SVG (Jake Archibald, 2013) · Lottie (Airbnb, 2017; After Effects trim paths played back in apps) · Lottie (Airbnb, 2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TRIM PATHS". Punchy sound design synced to every cut.
```
