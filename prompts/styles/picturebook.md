# Children's Book Animation

*Picture-book Illustration in Motion · 1950s — · 2D Animation & Illustration*

Reference film: `videos/picturebook.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Children's Book Animation** (Picture-book Illustration in Motion, 1950s —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Picture-book art carried to the screen with its paper, crayon and paint intact. Morton Schindel's Weston Woods "iconographic" films (from 1955) slowly panned across the original book illustrations; Dianne Jackson's The Snowman (1982) animated the soft coloured-pencil texture of Raymond Briggs's 1978 book; Studio AKA's Lost and Found (2008) and Magic Light Pictures' Julia Donaldson & Axel Scheffler films kept the page's look in motion. Eric Carle's painted tissue-paper collage and the deadpan restraint of Jon Klassen and Oliver Jeffers shaped the contemporary vocabulary.
- Study these reference works: Make Way for Ducklings (Weston Woods, 1955) · The Snowman (Dianne Jackson, 1982) · Lost and Found (Philip Hunt / Studio AKA, 2008, from Oliver Jeffers) · The Gruffalo (Jakob Schuh & Max Lang, 2009) · Room on the Broom (Jan Lachauer & Max Lang, 2012) · Eric Carle, The Very Hungry Caterpillar (book, 1969) · Jon Klassen, I Want My Hat Back (book, 2011)
- Motion DNA: Unhurried and quiet: the camera drifts, layers slide past each other in shallow parallax, the character does one small thing per page, and the story moves forward by turning the page. Eyes slide sideways instead of faces emoting.
- Visual DNA: Cream paper with visible tooth, translucent painted tissue shapes overlapping into darker layers, waxy broken crayon lines, coloured-pencil hatching over flat gouache skies, a small character with dot eyes, and serif story text set in the open sky of the spread.
- Signature transitions: Cover open, page turn, parallax drift, vertical pan, word-by-word text
- Key techniques: Paper-tooth crayon & coloured-pencil fills, Painted tissue-paper collage (multiply), Page-turn structure, Gentle multiplane parallax

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Paper-tooth crayon & coloured-pencil fills, Painted tissue-paper collage (multiply), Page-turn structure, Gentle multiplane parallax).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Paper-tooth crayon & coloured-pencil fills and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHILDREN'S BOOK ANIMATION", held for about 1 s.

BUILD RULES
- Suggested tools: Scanned textures + After Effects / Moho, TVPaint, Stop-frame cut paper, Canvas 2D (texture patterns, strip-drawn page turn). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Children's Book Animation motion-graphics film (Picture-book Illustration in Motion). Visual style: cream paper with visible tooth, translucent painted tissue shapes overlapping into darker layers, waxy broken crayon lines, coloured-pencil hatching over flat gouache skies, a small character with dot eyes, and serif story text set in the open sky of the spread. Motion: unhurried and quiet: the camera drifts, layers slide past each other in shallow parallax, the character does one small thing per page, and the story moves forward by turning the page. Eyes slide sideways instead of faces emoting. Signature moves: paper-tooth crayon & coloured-pencil fills, painted tissue-paper collage (multiply), page-turn structure, gentle multiplane parallax; transitions: cover open, page turn, parallax drift, vertical pan, word-by-word text. In the tradition of Make Way for Ducklings (Weston Woods, 1955) · The Snowman (Dianne Jackson, 1982) · Lost and Found (Philip Hunt / Studio AKA, 2008, from Oliver Jeffers) · The Gruffalo (Jakob Schuh & Max Lang, 2009) · Room on the Broom (Jan Lachauer & Max Lang, 2012) · Eric Carle, The Very Hungry Caterpillar (book, 1969) · Jon Klassen, I Want My Hat Back (book, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHILDREN'S BOOK ANIMATION". Punchy sound design synced to every cut.
```
