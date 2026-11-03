# Concrete Poetry

*Words Arranged as Image · 1953 — 1970 · Typography & Text Motion*

Reference film: `videos/concrete.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Concrete Poetry** (Words Arranged as Image, 1953 — 1970; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Concrete poetry treats the word as a material object, arranging letters and words on the page so that their placement, repetition and white space make the meaning instead of syntax. Eugen Gomringer’s constellations in Switzerland and the Brazilian Noigandres group of Augusto and Haroldo de Campos and Décio Pignatari named it in the 1950s, drawing on Apollinaire’s picture-poems; Ian Hamilton Finlay later carried it into prints, stone and a whole garden.
- Study these reference works: Calligrammes (Guillaume Apollinaire, 1918) · Noigandres magazine (Augusto de Campos, Haroldo de Campos, Décio Pignatari, from 1952) · silencio (Eugen Gomringer, 1954) · Little Sparta garden (Ian Hamilton Finlay, from 1966)
- Motion DNA: Sparse, exact and quiet: words are placed one at a time and then left alone, a held beat of nothing separates each poem, letters fall with gravity and stretch into streaks, words ride waves and rise as a sun, and every picture ebbs back into the white page before the next begins.
- Visual DNA: Black lowercase geometric sans and typewriter type on warm white paper with a single red accent; grids, slants, rings and rows of one repeated word, generous margins, and an empty centre that carries as much meaning as the letters around it.
- Signature transitions: Word-by-word setting, letters dripping off the page, typed horizon wipe, ebb to white
- Key techniques: Letter-level choreography, Words as picture elements, Gravity-timed rain of type

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Letter-level choreography, Words as picture elements, Gravity-timed rain of type).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Letter-level choreography and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CONCRETE POETRY", held for about 1 s.

BUILD RULES
- Suggested tools: Typewriter and letterpress on paper, After Effects per-character text animators, Canvas 2D (per-glyph layout, gravity-timed falls). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Concrete Poetry motion-graphics film (Words Arranged as Image). Visual style: black lowercase geometric sans and typewriter type on warm white paper with a single red accent; grids, slants, rings and rows of one repeated word, generous margins, and an empty centre that carries as much meaning as the letters around it. Motion: sparse, exact and quiet: words are placed one at a time and then left alone, a held beat of nothing separates each poem, letters fall with gravity and stretch into streaks, words ride waves and rise as a sun, and every picture ebbs back into the white page before the next begins. Signature moves: letter-level choreography, words as picture elements, gravity-timed rain of type; transitions: word-by-word setting, letters dripping off the page, typed horizon wipe, ebb to white. In the tradition of Calligrammes (Guillaume Apollinaire, 1918) · Noigandres magazine (Augusto de Campos, Haroldo de Campos, Décio Pignatari, from 1952) · silencio (Eugen Gomringer, 1954) · Little Sparta garden (Ian Hamilton Finlay, from 1966). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CONCRETE POETRY". Punchy sound design synced to every cut.
```
