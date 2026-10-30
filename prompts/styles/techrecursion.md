# Recursion

*A shape that contains itself · 1904 — · Technique Atlas*

Reference film: `videos/techrecursion.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Recursion** (A shape that contains itself, 1904 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A recursive picture is defined in terms of itself: draw the shape, then draw the whole picture again, smaller and turned, inside it, until the copies vanish. Koch’s snowflake (1904) and Escher’s and Droste’s self-containing images made the idea visual; Mandelbrot named fractals in 1975, and Barnsley’s iterated function systems (1988) made recursive copying a standard way to generate imagery in computer graphics.
- Study these reference works: Koch snowflake (Helge von Koch, 1904) · Print Gallery (M. C. Escher, 1956) · Fractals Everywhere — iterated function systems (Michael Barnsley, 1988)
- Motion DNA: Growth by levels: copies appear one per eighth note, each inside or on top of the last. The rule’s numbers then slide and the whole stack re-folds at once. Finally a steady exponential dive — four times closer per level — that never reaches the bottom and lands exactly where it started.
- Visual DNA: An orange Token and an ink Token alternating level by level, coiling into a spiral shell, then nested hole-in-hole like Russian dolls on the paper grid; a depth gauge of stacked ticks, the live rule in mono type and a zoom multiplier climbing to ×256.
- Signature transitions: Level-by-level build, a rule morph that re-folds every level together, then a seamless self-similar zoom that ends on the opening frame
- Key techniques: draw(n) calls draw(n − 1), One similarity transform per level, Infinite zoom to the fixed point

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (draw(n) calls draw(n − 1), One similarity transform per level, Infinite zoom to the fixed point).
- 5.0–8.0 s  Climax: the most spectacular moment, built on draw(n) calls draw(n − 1) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RECURSION", held for about 1 s.

BUILD RULES
- Suggested tools: Recursive draw function with a depth limit, Iterated similarity transform (scale · rotate · translate) and its fixed point, Canvas 2D: levels composed as M^k, camera as M^−z for fractional z. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Recursion motion-graphics film (A shape that contains itself). Visual style: an orange Token and an ink Token alternating level by level, coiling into a spiral shell, then nested hole-in-hole like Russian dolls on the paper grid; a depth gauge of stacked ticks, the live rule in mono type and a zoom multiplier climbing to ×256. Motion: growth by levels: copies appear one per eighth note, each inside or on top of the last. The rule’s numbers then slide and the whole stack re-folds at once. Finally a steady exponential dive — four times closer per level — that never reaches the bottom and lands exactly where it started. Signature moves: draw(n) calls draw(n − 1), one similarity transform per level, infinite zoom to the fixed point; transitions: level-by-level build, a rule morph that re-folds every level together, then a seamless self-similar zoom that ends on the opening frame. In the tradition of Koch snowflake (Helge von Koch, 1904) · Print Gallery (M. C. Escher, 1956) · Fractals Everywhere — iterated function systems (Michael Barnsley, 1988). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RECURSION". Punchy sound design synced to every cut.
```
