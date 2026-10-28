# High Contrast Cinema

*Black, White & One Spot Colour · 1980 — · Cinematic & Film Language*

Reference film: `videos/highcontrast.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **High Contrast Cinema** (Black, White & One Spot Colour, 1980 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Black-and-white pushed until the greys disappear: blacks crushed solid, highlights blown out, the image reduced to ink and paper, often with a single colour left alive in the frame. Martin Scorsese shot Raging Bull (1980) in stark monochrome, Steven Spielberg let one girl's red coat burn through Schindler's List (1993), Robert Rodriguez and Frank Miller turned Miller's comics into Sin City (2005) with digital keying and selective colour, and George Miller re-graded Mad Max: Fury Road as the Black & Chrome Edition (2016).
- Study these reference works: Raging Bull (Martin Scorsese, 1980) · Rumble Fish (Francis Ford Coppola, 1983) · Schindler's List (Steven Spielberg, 1993) · Sin City (Robert Rodriguez & Frank Miller, 2005) · The Spirit (Frank Miller, 2008) · Mad Max: Fury Road — Black & Chrome (George Miller, 2016)
- Motion DNA: Slow, deliberate push-ins and hard cuts like turning a page: a walk into a cone of light, a profile that barely turns, an overhead crowd flowing against one figure, and a single lightning beat that flips the sky before the title holds.
- Visual DNA: Pure black and pure white graphic shapes — lamp cones, window grids, a face carved by its shadow side, white-outlined silhouettes, slanting white rain and wet-street reflections — with one saturated red that stays in colour through every shot, plus comic-style narration boxes.
- Signature transitions: Hard cuts, a lightning flash, caption boxes
- Key techniques: Crushed blacks & clipped whites (no midtones), Selective colour — one hue spared, Inked rim outlines & silhouettes, Rain as white streaks (difference blend)

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Crushed blacks & clipped whites (no midtones), Selective colour — one hue spared, Inked rim outlines & silhouettes, Rain as white streaks (difference blend)).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Crushed blacks & clipped whites (no midtones) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "HIGH CONTRAST CINEMA", held for about 1 s.

BUILD RULES
- Suggested tools: Green-screen + digital backlot (Sin City), Power-window selective colour in DaVinci Resolve, Canvas 2D (two-tone vector, difference-blend rain). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second High Contrast Cinema motion-graphics film (Black, White & One Spot Colour). Visual style: pure black and pure white graphic shapes — lamp cones, window grids, a face carved by its shadow side, white-outlined silhouettes, slanting white rain and wet-street reflections — with one saturated red that stays in colour through every shot, plus comic-style narration boxes. Motion: slow, deliberate push-ins and hard cuts like turning a page: a walk into a cone of light, a profile that barely turns, an overhead crowd flowing against one figure, and a single lightning beat that flips the sky before the title holds. Signature moves: crushed blacks & clipped whites (no midtones), selective colour — one hue spared, inked rim outlines & silhouettes, rain as white streaks (difference blend); transitions: hard cuts, a lightning flash, caption boxes. In the tradition of Raging Bull (Martin Scorsese, 1980) · Rumble Fish (Francis Ford Coppola, 1983) · Schindler's List (Steven Spielberg, 1993) · Sin City (Robert Rodriguez & Frank Miller, 2005) · The Spirit (Frank Miller, 2008) · Mad Max: Fury Road — Black & Chrome (George Miller, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "HIGH CONTRAST CINEMA". Punchy sound design synced to every cut.
```
