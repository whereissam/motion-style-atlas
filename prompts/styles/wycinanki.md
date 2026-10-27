# Folk Paper-cut

*Wycinanki · Vytynanky · 19th c. — · Cultural & Regional*

Reference film: `videos/wycinanki.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Folk Paper-cut** (Wycinanki · Vytynanky, 19th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Rural Poland took up paper-cutting in the 19th century, when glazed coloured paper reached village markets: households cut decorations freehand with sheep shears to brighten whitewashed cottage walls and beams for Easter and Christmas. Kurpie cutters fold one sheet to cut symmetric single-colour leluja trees; Łowicz cutters glue many colours in layers into stars and roosters. Ukraine’s vytynanky are a close cousin.
- Study these reference works: Kurpie leluja and gwiazdy (Kurpie Green Forest region) · Łowicz kodry and gwiazdy, Łowicz Regional Museum · Czesława Kwoka, Kurpie paper-cutter (1932–2021) · Polish Ethnographic Museum collections, Warsaw · Ukrainian vytynanky, Kyiv and Lviv
- Motion DNA: Snip-by-snip reveals on the beat: shears trace the fold, scraps drop away, the sheet flips open into symmetry, and coloured layers slap down one on top of another like a mazurka step.
- Visual DNA: Matte, flat glazed paper in fuchsia, green, yellow, orange, cobalt and black on a whitewashed wall: mirrored trees of life, birds and roosters, scalloped stars and tiny slit veins, each layer with a crisp edge and soft shadow.
- Signature transitions: Scissor trace, fold-out flip, layer drop, cut-paper title
- Key techniques: Freehand scissor cutting on the fold, Mirror symmetry by unfolding, Layered glazed paper (Łowicz), Cut-out slits and holes as line

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Freehand scissor cutting on the fold, Mirror symmetry by unfolding, Layered glazed paper (Łowicz), Cut-out slits and holes as line).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Freehand scissor cutting on the fold and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FOLK PAPER-CUT", held for about 1 s.

BUILD RULES
- Suggested tools: Scissors + glazed paper, Illustrator / cut-out AE rigs, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Folk Paper-cut motion-graphics film (Wycinanki · Vytynanky). Visual style: matte, flat glazed paper in fuchsia, green, yellow, orange, cobalt and black on a whitewashed wall: mirrored trees of life, birds and roosters, scalloped stars and tiny slit veins, each layer with a crisp edge and soft shadow. Motion: snip-by-snip reveals on the beat: shears trace the fold, scraps drop away, the sheet flips open into symmetry, and coloured layers slap down one on top of another like a mazurka step. Signature moves: freehand scissor cutting on the fold, mirror symmetry by unfolding, layered glazed paper (łowicz), cut-out slits and holes as line; transitions: scissor trace, fold-out flip, layer drop, cut-paper title. In the tradition of Kurpie leluja and gwiazdy (Kurpie Green Forest region) · Łowicz kodry and gwiazdy, Łowicz Regional Museum · Czesława Kwoka, Kurpie paper-cutter (1932–2021) · Polish Ethnographic Museum collections, Warsaw · Ukrainian vytynanky, Kyiv and Lviv. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FOLK PAPER-CUT". Punchy sound design synced to every cut.
```
