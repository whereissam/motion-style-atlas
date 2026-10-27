# Psychedelic 60s

*Liquid Light and Melting Letters · 1966 — · Graphic Design & Historical*

Reference film: `videos/psychedelic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Psychedelic 60s** (Liquid Light and Melting Letters, 1966 —; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In San Francisco's 1966–68 dance-hall scene, Wes Wilson, Victor Moscoso and others made concert posters whose letters swelled to fill shapes and whose complementary colours vibrated; liquid light shows of dyed oil on overhead projectors played behind the bands, and Peter Max and "Yellow Submarine" took the look to pop.
- Study these reference works: Fillmore Auditorium posters (Wes Wilson, 1966–67) · "Neon Rose" series (Victor Moscoso, 1967) · "Yellow Submarine" (Heinz Edelmann, 1968) · Peter Max posters (late 1960s) · Joshua Light Show at the Fillmore East (1968 —)
- Motion DNA: Nothing is rigid: colour pools, folds, spirals and cycles on the beat, flowers spring open, and letters flow like hot wax until they settle into a swollen, legible shape.
- Visual DNA: Same-value complementary colours that vibrate, liquid dye blobs, op-art spirals, outlined flowers and hand-lettering stretched to fill a balloon.
- Signature transitions: Kaleidoscope fold, spiral iris, liquid-edged radial wipes, zoom-through tunnel, melt-in with drips.
- Key techniques: Subtractive dye metaballs on a projector hotspot, Kaleidoscope fold and log-spiral op-art, Per-pixel shape-filling text warp, Blur-threshold "goo" lettering

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Subtractive dye metaballs on a projector hotspot, Kaleidoscope fold and log-spiral op-art, Per-pixel shape-filling text warp, Blur-threshold "goo" lettering).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Subtractive dye metaballs on a projector hotspot and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PSYCHEDELIC 60S", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Liquid light show, GLSL. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Psychedelic 60s motion-graphics film (Liquid Light and Melting Letters). Visual style: same-value complementary colours that vibrate, liquid dye blobs, op-art spirals, outlined flowers and hand-lettering stretched to fill a balloon. Motion: nothing is rigid: colour pools, folds, spirals and cycles on the beat, flowers spring open, and letters flow like hot wax until they settle into a swollen, legible shape. Signature moves: subtractive dye metaballs on a projector hotspot, kaleidoscope fold and log-spiral op-art, per-pixel shape-filling text warp, blur-threshold "goo" lettering; transitions: kaleidoscope fold, spiral iris, liquid-edged radial wipes, zoom-through tunnel, melt-in with drips. In the tradition of Fillmore Auditorium posters (Wes Wilson, 1966–67) · "Neon Rose" series (Victor Moscoso, 1967) · "Yellow Submarine" (Heinz Edelmann, 1968) · Peter Max posters (late 1960s) · Joshua Light Show at the Fillmore East (1968 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PSYCHEDELIC 60S". Punchy sound design synced to every cut.
```
