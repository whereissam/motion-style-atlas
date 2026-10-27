# Papel Picado

*Mexican Cut-Paper Banners · 19th c. — · Cultural & Regional*

Reference film: `videos/papelpicado.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Papel Picado** (Mexican Cut-Paper Banners, 19th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Artisans in Puebla towns such as San Salvador Huixcolotla chisel stacks of tissue paper into lace-like banners, strung over streets, altars and churchyards for fiestas and the Día de Muertos ofrendas. Pixar’s Coco and The Book of Life made its fluttering colour a global shorthand for Mexico.
- Study these reference works: Coco (Pixar, 2017) · The Book of Life (Reel FX, 2014) · San Salvador Huixcolotla papel picado workshops, Puebla · Día de Muertos ofrendas · Fiestas patrias street decorations
- Motion DNA: A slow dolly under rows of banners that sway on sagging cords, each flag rippling and lifting in gusts, with marigold petals drifting through the light.
- Visual DNA: Hot pink, orange, purple, green and blue tissue cut into skulls, flowers, birds and lattice, glowing against a sunset sky, over candlelit streets and a marigold petal path.
- Signature transitions: Gust lifts a close-up flag away, dolly-through, petal storm, final banner settles to spell the title
- Key techniques: Chisel-cut tissue lattice, Backlit translucency, Wind flutter & dolly under the rows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Chisel-cut tissue lattice, Backlit translucency, Wind flutter & dolly under the rows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Chisel-cut tissue lattice and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PAPEL PICADO", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-chiselled tissue, Blender / Houdini cloth, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Papel Picado motion-graphics film (Mexican Cut-Paper Banners). Visual style: hot pink, orange, purple, green and blue tissue cut into skulls, flowers, birds and lattice, glowing against a sunset sky, over candlelit streets and a marigold petal path. Motion: a slow dolly under rows of banners that sway on sagging cords, each flag rippling and lifting in gusts, with marigold petals drifting through the light. Signature moves: chisel-cut tissue lattice, backlit translucency, wind flutter & dolly under the rows; transitions: gust lifts a close-up flag away, dolly-through, petal storm, final banner settles to spell the title. In the tradition of Coco (Pixar, 2017) · The Book of Life (Reel FX, 2014) · San Salvador Huixcolotla papel picado workshops, Puebla · Día de Muertos ofrendas · Fiestas patrias street decorations. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PAPEL PICADO". Punchy sound design synced to every cut.
```
