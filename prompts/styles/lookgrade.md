# Teal & Orange Grade

*Lift, gamma, gain and a split-tone, in post · 2000 — · Rendering Looks*

Reference film: `videos/lookgrade.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Teal & Orange Grade** (Lift, gamma, gain and a split-tone, in post, 2000 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Colour grading moved from photochemical timing to software when O Brother, Where Art Thou? (2000) was scanned, graded digitally and recorded back to film — the first feature finished entirely through a digital intermediate. Three-way correctors, with lift, gamma and gain wheels for shadows, midtones and highlights, became the grader’s instrument, and the teal-and-orange look that pushes skin and warm subjects one way and shadows and backgrounds the complementary way spread through blockbusters in the 2000s. Bleach bypass imitates skipping the bleach step in film processing, leaving silver in the image: lower saturation, harder contrast.
- Study these reference works: O Brother, Where Art Thou? (Joel and Ethan Coen, 2000; digital intermediate) · Transformers (Michael Bay, 2007; teal and orange) · Saving Private Ryan (Steven Spielberg, 1998; bleach-bypass-style desaturation)
- Motion DNA: The camera makes the shared 50° orbit. A split opens on the plain render, then the grade is built one control per beat — lift, gamma, gain, then contrast, saturation and the split-tone — while the wheels’ pucks travel and the vectorscope trace leans; the split clears to the full grade, a wipe swaps in bleach bypass, and the film ends on three bands: plain, teal & orange, bleach.
- Visual DNA: The same still life recoloured: teal-green shadows and floor falloff against a peach backdrop and a hotter orange Token; then silvery, near-monochrome bleach bypass. Three colour wheels and a live vectorscope with its skin-tone line sit on a paper panel; per-channel numbers update as the controls move; the caption draws the luma transfer curve.
- Signature transitions: Before/after split, a linear wipe between presets, three comparison bands
- Key techniques: Lift / gamma / gain per channel, Teal shadows, orange highlights, Bleach bypass as a second preset

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Lift / gamma / gain per channel, Teal shadows, orange highlights, Bleach bypass as a second preset).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Lift / gamma / gain per channel and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEAL & ORANGE GRADE", held for about 1 s.

BUILD RULES
- Suggested tools: DaVinci Resolve / Baselight three-way colour correctors, ASC CDL (slope, offset, power) and LUTs, Canvas 2D + SDF tracer (js/look-kit.js): the plain render graded per pixel in opts.post, scope built from a subsampled buffer. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Teal & Orange Grade motion-graphics film (Lift, gamma, gain and a split-tone, in post). Visual style: the same still life recoloured: teal-green shadows and floor falloff against a peach backdrop and a hotter orange Token; then silvery, near-monochrome bleach bypass. Three colour wheels and a live vectorscope with its skin-tone line sit on a paper panel; per-channel numbers update as the controls move; the caption draws the luma transfer curve. Motion: the camera makes the shared 50° orbit. A split opens on the plain render, then the grade is built one control per beat — lift, gamma, gain, then contrast, saturation and the split-tone — while the wheels’ pucks travel and the vectorscope trace leans; the split clears to the full grade, a wipe swaps in bleach bypass, and the film ends on three bands: plain, teal & orange, bleach. Signature moves: lift / gamma / gain per channel, teal shadows, orange highlights, bleach bypass as a second preset; transitions: before/after split, a linear wipe between presets, three comparison bands. In the tradition of O Brother, Where Art Thou? (Joel and Ethan Coen, 2000; digital intermediate) · Transformers (Michael Bay, 2007; teal and orange) · Saving Private Ryan (Steven Spielberg, 1998; bleach-bypass-style desaturation). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEAL & ORANGE GRADE". Punchy sound design synced to every cut.
```
