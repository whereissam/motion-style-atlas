# Film Grain & Halation

*Seeded grain, red halation, weave and vignette · 2000s — · Rendering Looks*

Reference film: `videos/lookgrain.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Film Grain & Halation** (Seeded grain, red halation, weave and vignette, 2000s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Film grain is the visible clumping of silver halide crystals and dye clouds in the emulsion; it is strongest in the midtones and changes every frame because every frame is a new piece of film. Halation is the red-orange glow around bright edges where light passes through the emulsion, reflects off the film base and re-exposes the red-sensitive layer from behind; anti-halation backings suppress it, and stocks without one show it strongly. Gate weave is the slight frame-to-frame drift of film in the camera and projector gate. As digital cameras replaced film, finishing tools added these artefacts back on purpose, from scanned grain plates to procedural emulations.
- Study these reference works: Dune (Denis Villeneuve, 2021; shot digitally, recorded out to film and scanned back for its texture) · Euphoria season 2 (HBO, 2022; shot on Kodak Ektachrome) · Dehancer (film-emulation plug-in modelling grain, halation and bloom)
- Motion DNA: The camera makes the shared 50° orbit while the finish builds on the beat: grain fades in and starts boiling at 30 frames a second, the halation threshold glow rises until the rim-lit edges bleed red, the gate begins to weave and the vignette closes in; a split then shows the clean render against the finish before the whole frame returns to film.
- Visual DNA: A low-key version of the still life: black studio, one hard key and a rim light that rings each object in white, each ring haloed in red-orange; fine monochrome grain alive in the midtones, quiet in the blacks; soft dark corners. Insets show the grain plate and the halation pass; a loupe magnifies a rim edge at 3×; mono readouts give grain σ, frame seed, threshold, halation strength, weave and vignette.
- Signature transitions: Effects layered on one by one; a split against the clean render
- Key techniques: Grain seeded by frame, midtone weighted, Halation from blurred threshold, Gate weave + vignette

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Grain seeded by frame, midtone weighted, Halation from blurred threshold, Gate weave + vignette).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Grain seeded by frame, midtone weighted and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FILM GRAIN & HALATION", held for about 1 s.

BUILD RULES
- Suggested tools: Scanned grain plates / FilmConvert / Dehancer-style film emulation, Nuke or Resolve: threshold, blur and red-tinted add for halation, Canvas 2D + SDF tracer (js/look-kit.js): opts.post halation blur, hash(x, y, frame) grain, vignette; gate weave as a per-frame draw offset. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (grain is a pure function of pixel and frame index).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Film Grain & Halation motion-graphics film (Seeded grain, red halation, weave and vignette). Visual style: a low-key version of the still life: black studio, one hard key and a rim light that rings each object in white, each ring haloed in red-orange; fine monochrome grain alive in the midtones, quiet in the blacks; soft dark corners. Insets show the grain plate and the halation pass; a loupe magnifies a rim edge at 3×; mono readouts give grain σ, frame seed, threshold, halation strength, weave and vignette. Motion: the camera makes the shared 50° orbit while the finish builds on the beat: grain fades in and starts boiling at 30 frames a second, the halation threshold glow rises until the rim-lit edges bleed red, the gate begins to weave and the vignette closes in; a split then shows the clean render against the finish before the whole frame returns to film. Signature moves: grain seeded by frame, midtone weighted, halation from blurred threshold, gate weave + vignette; transitions: effects layered on one by one; a split against the clean render. In the tradition of Dune (Denis Villeneuve, 2021; shot digitally, recorded out to film and scanned back for its texture) · Euphoria season 2 (HBO, 2022; shot on Kodak Ektachrome) · Dehancer (film-emulation plug-in modelling grain, halation and bloom). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FILM GRAIN & HALATION". Punchy sound design synced to every cut.
```
