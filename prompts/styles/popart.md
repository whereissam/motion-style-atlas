# Pop Art

*Ben-Day Dots and Silkscreen · 1956 — 1970 · Graphic Design & Historical*

Reference film: `videos/popart.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pop Art** (Ben-Day Dots and Silkscreen, 1956 — 1970; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Pop Art took mass culture as its subject and mechanical printing as its look: the term came from London’s Independent Group, where Richard Hamilton made his 1956 collage of the consumer home, and in New York Roy Lichtenstein painted enlarged comic panels dot by Ben-Day dot while Andy Warhol silkscreened photographs in repeating grids with flat, off-register colour.
- Study these reference works: Just what is it that makes today’s homes so different, so appealing? (Richard Hamilton, 1956) · Look Mickey (Roy Lichtenstein, 1961) · Campbell’s Soup Cans (Andy Warhol, 1962) · Marilyn Diptych (Warhol, 1962) · Drowning Girl (Lichtenstein, 1963) · Whaam! (Lichtenstein, 1963)
- Motion DNA: Mechanical and serial: a single dot pulls back into a whole painting, a squeegee drags the next image over the last, prints are pulled one after another outward from the first, each with its own slip of registration and ink, and the camera keeps backing away until the image is an object on a gallery wall.
- Visual DNA: Primary red, yellow and blue with heavy black outlines and enlarged dot screens for Lichtenstein; fluorescent pink, orange, turquoise, lime and silver flats under a slipped black photo screen for Warhol; repetition in a tight grid, all on raw linen in a white-cube gallery.
- Signature transitions: Pull-back from a single dot, squeegee wipe, print-by-print grid growth, dolly-out to the gallery wall
- Key techniques: Enlarged Ben-Day dots, Off-register silkscreen key, Serial grid repetition

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Enlarged Ben-Day dots, Off-register silkscreen key, Serial grid repetition).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Enlarged Ben-Day dots and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "POP ART", held for about 1 s.

BUILD RULES
- Suggested tools: Silkscreen and oil on canvas, stencilled dot screens, Illustrator + After Effects halftone and offsets, Canvas 2D (pre-printed flats and key, time-staggered pulls). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pop Art motion-graphics film (Ben-Day Dots and Silkscreen). Visual style: primary red, yellow and blue with heavy black outlines and enlarged dot screens for Lichtenstein; fluorescent pink, orange, turquoise, lime and silver flats under a slipped black photo screen for Warhol; repetition in a tight grid, all on raw linen in a white-cube gallery. Motion: mechanical and serial: a single dot pulls back into a whole painting, a squeegee drags the next image over the last, prints are pulled one after another outward from the first, each with its own slip of registration and ink, and the camera keeps backing away until the image is an object on a gallery wall. Signature moves: enlarged ben-day dots, off-register silkscreen key, serial grid repetition; transitions: pull-back from a single dot, squeegee wipe, print-by-print grid growth, dolly-out to the gallery wall. In the tradition of Just what is it that makes today’s homes so different, so appealing? (Richard Hamilton, 1956) · Look Mickey (Roy Lichtenstein, 1961) · Campbell’s Soup Cans (Andy Warhol, 1962) · Marilyn Diptych (Warhol, 1962) · Drowning Girl (Lichtenstein, 1963) · Whaam! (Lichtenstein, 1963). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "POP ART". Punchy sound design synced to every cut.
```
