# Halftone

*CMYK dot screens at four angles; AM against FM · 1880s — · Rendering Looks*

Reference film: `videos/lookhalftone.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Halftone** (CMYK dot screens at four angles; AM against FM, 1880s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Printing presses cannot print grey: a spot either takes ink or it does not, so continuous tone is broken into dots whose size follows the tone. Photographic halftone screens appeared in the 1880s — Frederic Ives in Philadelphia and Georg Meisenbach in Munich were among their inventors — and newspapers adopted them for photographs around 1900. Colour printing separates the image into cyan, magenta, yellow and black and gives each its own screen angle, conventionally 15°, 75°, 0° and 45°, so the grids form a small rosette instead of a visible moiré. Stochastic or FM screening, which keeps one tiny dot size and varies how many there are, came with digital imagesetters in the 1990s.
- Study these reference works: Roy Lichtenstein, Drowning Girl (1963; Ben-Day dots enlarged into the image) · Sigmar Polke, raster paintings (1960s; enlarged halftone dots) · Into the Spider-Verse (Sony Pictures Animation, 2018; halftone shading in an animated feature)
- Motion DNA: The camera makes the shared 50° orbit. A wipe prints the plain render into four dot screens; the separations and the screen-angle diagram come up, and the screen ruling steps finer on each beat — 20, 14, 10, 7.5 px cells — before settling at 12 for a loupe on the rosette. Then the press runs one ink only: AM dots fill the frame, and a wipe brings in FM stochastic dots for the right half, with a loupe straddling the line.
- Visual DNA: Warm newsprint paper; the orange Token as overlapping magenta and yellow dots, the blue cube as cyan and magenta, shadows built from black dots at 45°, every dot a vector circle that sharpens under the loupe. Paper panels hold the readouts, the four separation plates in their inks, the source render and a protractor of the four screen angles; the coda is black ink alone, ordered dots on the left, grainy stochastic dots on the right.
- Signature transitions: Wipe from the plain render to print; hard cut on the beat to one ink; split AM | FM
- Key techniques: CMYK separation, 70 % black replacement, Screens at C 15° · M 75° · Y 0° · K 45°, AM dots vs FM error diffusion

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (CMYK separation, 70 % black replacement, Screens at C 15° · M 75° · Y 0° · K 45°, AM dots vs FM error diffusion).
- 5.0–8.0 s  Climax: the most spectacular moment, built on CMYK separation, 70 % black replacement and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HALFTONE", held for about 1 s.

BUILD RULES
- Suggested tools: Photoshop / RIP halftone screening (Bitmap, Color Halftone filters), Print workflow: CMYK separation with GCR/UCR, screen angles, stochastic (FM) screening, Canvas 2D + SDF tracer (js/look-kit.js): plain render sampled bilinearly per lattice point, one arc path per ink composited with multiply; FM by serpentine Floyd–Steinberg on a 3 px grid. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Halftone motion-graphics film (CMYK dot screens at four angles; AM against FM). Visual style: warm newsprint paper; the orange Token as overlapping magenta and yellow dots, the blue cube as cyan and magenta, shadows built from black dots at 45°, every dot a vector circle that sharpens under the loupe. Paper panels hold the readouts, the four separation plates in their inks, the source render and a protractor of the four screen angles; the coda is black ink alone, ordered dots on the left, grainy stochastic dots on the right. Motion: the camera makes the shared 50° orbit. A wipe prints the plain render into four dot screens; the separations and the screen-angle diagram come up, and the screen ruling steps finer on each beat — 20, 14, 10, 7.5 px cells — before settling at 12 for a loupe on the rosette. Then the press runs one ink only: AM dots fill the frame, and a wipe brings in FM stochastic dots for the right half, with a loupe straddling the line. Signature moves: cmyk separation, 70 % black replacement, screens at c 15° · m 75° · y 0° · k 45°, am dots vs fm error diffusion; transitions: wipe from the plain render to print; hard cut on the beat to one ink; split AM | FM. In the tradition of Roy Lichtenstein, Drowning Girl (1963; Ben-Day dots enlarged into the image) · Sigmar Polke, raster paintings (1960s; enlarged halftone dots) · Into the Spider-Verse (Sony Pictures Animation, 2018; halftone shading in an animated feature). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HALFTONE". Punchy sound design synced to every cut.
```
