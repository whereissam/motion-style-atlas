# African Pattern Animation

*Kente · Adinkra · Ndebele · 17th c. — today · Cultural & Regional*

Reference film: `videos/africanpattern.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **African Pattern Animation** (Kente · Adinkra · Ndebele, 17th c. — today; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Not one “African style” but distinct living traditions. Kente is woven by Asante and Ewe weavers in Ghana on horizontal treadle looms as narrow strips (about 10 cm) that are sewn edge to edge, alternating warp-faced stripes and weft-faced blocks; Adinkra cloth, also Asante, is ruled with a comb and stamped with carved-calabash symbols, each a named proverb; amaNdebele women in South Africa paint homestead walls with black-outlined geometry and flat colour, a practice Esther Mahlangu carried onto canvas, a BMW Art Car and global design.
- Study these reference works: Asante royal Kente (Bonwire, Ashanti Region) and Ewe Kente (Agotime, Volta Region) · Adinkra cloths from Ntonso, Ghana; symbol sets catalogued by W. Bruce Willis, The Adinkra Dictionary (1998) · Esther Mahlangu, BMW 525i Art Car (1991) and Magiciens de la Terre, Paris (1989) · Kente stoles in graduation and diaspora fashion
- Motion DNA: Motion follows the making: shuttle and beater on the 12/8 bell, strips sliding together into a checkerboard, stamps pressing down on the dotted-quarter beat with each symbol’s name, a brush tip tracing black outlines and colour flooding each field.
- Visual DNA: Gold, green, red and black Kente with blocky weft-faced motifs; black Adinkra symbols in comb-ruled squares on cream cotton; whitewashed Ndebele walls of stepped gables, razor-blade hexagons and ladder stripes in primary colour with thick black and fine white outlines.
- Signature transitions: Loom pull-back to sewn cloth, cloth slide-over, comb rake, stamp press, lime-wash brush wipe, collapse into a labelled triptych
- Key techniques: Narrow-strip treadle-loom weaving, strips sewn edge to edge, Comb-ruled grid and calabash stamps in badie-bark ink, Freehand black outlines filled with flat colour, Each motif named; meaning carried by symbol and colour

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Narrow-strip treadle-loom weaving, strips sewn edge to edge, Comb-ruled grid and calabash stamps in badie-bark ink, Freehand black outlines filled with flat colour, Each motif named; meaning carried by symbol and colour).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Narrow-strip treadle-loom weaving, strips sewn edge to edge and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "AFRICAN PATTERN ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Loom, stamp and brush as process animation, Illustrator / AE shape layers with trim paths, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second African Pattern Animation motion-graphics film (Kente · Adinkra · Ndebele). Visual style: gold, green, red and black Kente with blocky weft-faced motifs; black Adinkra symbols in comb-ruled squares on cream cotton; whitewashed Ndebele walls of stepped gables, razor-blade hexagons and ladder stripes in primary colour with thick black and fine white outlines. Motion: motion follows the making: shuttle and beater on the 12/8 bell, strips sliding together into a checkerboard, stamps pressing down on the dotted-quarter beat with each symbol’s name, a brush tip tracing black outlines and colour flooding each field. Signature moves: narrow-strip treadle-loom weaving, strips sewn edge to edge, comb-ruled grid and calabash stamps in badie-bark ink, freehand black outlines filled with flat colour, each motif named; meaning carried by symbol and colour; transitions: loom pull-back to sewn cloth, cloth slide-over, comb rake, stamp press, lime-wash brush wipe, collapse into a labelled triptych. In the tradition of Asante royal Kente (Bonwire, Ashanti Region) and Ewe Kente (Agotime, Volta Region) · Adinkra cloths from Ntonso, Ghana; symbol sets catalogued by W. Bruce Willis, The Adinkra Dictionary (1998) · Esther Mahlangu, BMW 525i Art Car (1991) and Magiciens de la Terre, Paris (1989) · Kente stoles in graduation and diaspora fashion. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "AFRICAN PATTERN ANIMATION". Punchy sound design synced to every cut.
```
