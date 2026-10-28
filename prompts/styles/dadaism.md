# Dadaism

*Anti-Art, Chance and Sound Poetry · 1916 — 1924 · Graphic Design & Historical*

Reference film: `videos/dadaism.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dadaism** (Anti-Art, Chance and Sound Poetry, 1916 — 1924; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Born at the Cabaret Voltaire in Zürich in February 1916, where Hugo Ball, Emmy Hennings, Tristan Tzara, Marcel Janco, Richard Huelsenbeck and Hans Arp staged sound poems, noise music and masks as a revolt against the logic that had produced the First World War. Berlin Dada (Raoul Hausmann, Hannah Höch, John Heartfield) invented political photomontage, Kurt Schwitters built Merz collages from rubbish in Hanover, and Hans Richter, Viking Eggeling and Marcel Duchamp carried it into abstract film.
- Study these reference works: Karawane (Hugo Ball, sound poem, 1916) · Cut with the Kitchen Knife Dada … (Hannah Höch, 1919–20) · Mechanical Head (Raoul Hausmann, c. 1920) · Squares Arranged According to the Laws of Chance (Hans Arp, 1916–17) · Rhythmus 21 (Hans Richter, 1921) · Anémic Cinéma (Marcel Duchamp, 1926) · Merz magazine (Kurt Schwitters, 1923–32)
- Motion DNA: Deliberately unreasonable: abstract rectangles breathe and collapse, discs spin hypnotically, cut-outs fall where chance puts them, words slam down crooked and then re-roll their faces and angles on every eighth note before being blown off the page.
- Visual DNA: Yellowed newsprint, black and one red, halftone photo cut-outs with scissor edges, gears and printers’ hands, and every word in a different wood or metal type, set at angles, in mismatched sizes, never on a grid.
- Signature transitions: Rhythmus collapse to iris, rotorelief cut, torn-sheet rise, chance drop, word slam, page blow-out, letter-by-letter title set
- Key techniques: Keyframed Rhythmus planes with one inversion, Rotating eccentric-circle rotorelief, Seeded chance drops and re-rolls, Mixed wood-type setting per word

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Keyframed Rhythmus planes with one inversion, Rotating eccentric-circle rotorelief, Seeded chance drops and re-rolls, Mixed wood-type setting per word).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Keyframed Rhythmus planes with one inversion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DADAISM", held for about 1 s.

BUILD RULES
- Suggested tools: Physical photomontage and letterpress, 16 mm animation stand (Richter, Duchamp), After Effects cut-outs, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dadaism motion-graphics film (Anti-Art, Chance and Sound Poetry). Visual style: yellowed newsprint, black and one red, halftone photo cut-outs with scissor edges, gears and printers’ hands, and every word in a different wood or metal type, set at angles, in mismatched sizes, never on a grid. Motion: deliberately unreasonable: abstract rectangles breathe and collapse, discs spin hypnotically, cut-outs fall where chance puts them, words slam down crooked and then re-roll their faces and angles on every eighth note before being blown off the page. Signature moves: keyframed rhythmus planes with one inversion, rotating eccentric-circle rotorelief, seeded chance drops and re-rolls, mixed wood-type setting per word; transitions: rhythmus collapse to iris, rotorelief cut, torn-sheet rise, chance drop, word slam, page blow-out, letter-by-letter title set. In the tradition of Karawane (Hugo Ball, sound poem, 1916) · Cut with the Kitchen Knife Dada … (Hannah Höch, 1919–20) · Mechanical Head (Raoul Hausmann, c. 1920) · Squares Arranged According to the Laws of Chance (Hans Arp, 1916–17) · Rhythmus 21 (Hans Richter, 1921) · Anémic Cinéma (Marcel Duchamp, 1926) · Merz magazine (Kurt Schwitters, 1923–32). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DADAISM". Punchy sound design synced to every cut.
```
