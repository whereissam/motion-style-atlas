# Pixel Art

*Low resolution, a fixed palette, ordered dither · 1970s — · Rendering Looks*

Reference film: `videos/lookpixel.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pixel Art** (Low resolution, a fixed palette, ordered dither, 1970s —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Pixel art grew out of the hard limits of early computer and console graphics: low resolutions shown on large screens and a handful of colours fixed by the hardware, which artists placed pixel by pixel. The term is usually traced to Adele Goldberg and Robert Flegal at Xerox PARC (1982). Ordered dithering, which fakes extra tones by comparing each pixel against a tiled threshold matrix, was formalised by Bryce Bayer at Kodak in 1973; Nintendo’s Game Boy (1989) showed four shades of green. Rendering 3D scenes small and snapping them to a palette, as here, is a later way of getting the look; Lucas Pope’s Return of the Obra Dinn renders its 3D world into dithered 1-bit.
- Study these reference works: The Secret of Monkey Island (Lucasfilm Games, 1990) · The Legend of Zelda: Link’s Awakening (Nintendo, 1993; Game Boy, four shades) · Return of the Obra Dinn (Lucas Pope, 2018; dithered 3D)
- Motion DNA: The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. On each beat the render resolution halves its way down from 800 × 450 to 160 × 90; the palette wipes in without dither, a second wipe adds Bayer dithering, the outline pass snaps on with the beat, and a last wipe swaps to the four Game Boy greens. Because the scene is re-rendered small every frame, the pixels crawl along edges as the camera moves.
- Visual DNA: Hard square pixels twelve screen pixels wide; PICO-8 colours — orange and brown on the Token, sky blue and navy on the cube, warm white and grey on the floor — with checkered Bayer patterns in every gradient and dark one-pixel outlines; at the end olive-to-pale-green Game Boy tones. Palette swatches marking the colours in use, the 4 × 4 threshold matrix, a resolution readout.
- Signature transitions: Hard resolution steps on the beat; wipes to the palette, to dithering and to the Game Boy palette; the outline snaps on
- Key techniques: Low internal res, integer nearest-neighbour upscale, 16-colour palette, Bayer 4 × 4 ordered dither, One-pixel outline from the object-id buffer

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Low internal res, integer nearest-neighbour upscale, 16-colour palette, Bayer 4 × 4 ordered dither, One-pixel outline from the object-id buffer).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Low internal res, integer nearest-neighbour upscale and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PIXEL ART", held for about 1 s.

BUILD RULES
- Suggested tools: Low-res render target with point (nearest) sampling on upscale, Ordered dithering against a Bayer index matrix into a fixed palette (shader or post), Canvas 2D + SDF tracer (js/look-kit.js): LK.gbuffer at the small size, LK.plain shaded, palette snap + Bayer + id-buffer outline in post, drawn with imageSmoothingEnabled = false. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pixel Art motion-graphics film (Low resolution, a fixed palette, ordered dither). Visual style: hard square pixels twelve screen pixels wide; PICO-8 colours — orange and brown on the Token, sky blue and navy on the cube, warm white and grey on the floor — with checkered Bayer patterns in every gradient and dark one-pixel outlines; at the end olive-to-pale-green Game Boy tones. Palette swatches marking the colours in use, the 4 × 4 threshold matrix, a resolution readout. Motion: the shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. On each beat the render resolution halves its way down from 800 × 450 to 160 × 90; the palette wipes in without dither, a second wipe adds Bayer dithering, the outline pass snaps on with the beat, and a last wipe swaps to the four Game Boy greens. Because the scene is re-rendered small every frame, the pixels crawl along edges as the camera moves. Signature moves: low internal res, integer nearest-neighbour upscale, 16-colour palette, bayer 4 × 4 ordered dither, one-pixel outline from the object-id buffer; transitions: hard resolution steps on the beat; wipes to the palette, to dithering and to the Game Boy palette; the outline snaps on. In the tradition of The Secret of Monkey Island (Lucasfilm Games, 1990) · The Legend of Zelda: Link’s Awakening (Nintendo, 1993; Game Boy, four shades) · Return of the Obra Dinn (Lucas Pope, 2018; dithered 3D). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PIXEL ART". Punchy sound design synced to every cut.
```
