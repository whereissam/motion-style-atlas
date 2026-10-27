# Islamic Geometry

*Girih & Zellige · 9th c. — · Cultural & Regional*

Reference film: `videos/islamic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Islamic Geometry** (Girih & Zellige, 9th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Across the Islamic world, craftsmen generated star-and-polygon patterns with nothing but compass and straightedge, then cut them in tile (zellige), wood and stucco as interlacing strapwork (girih). Working scrolls such as the Topkapı Scroll record the construction lines behind the finished surfaces.
- Study these reference works: Alhambra zellige, Granada (14th c.) · Darb-i Imam shrine girih, Isfahan (1453) · Topkapı Scroll (15th–16th c.) · Ben Youssef Madrasa, Marrakesh (1560s) · Sheikh Lotfollah Mosque, Isfahan (1619)
- Motion DNA: Everything is constructed before it is decorated: arcs and ruled lines draw a grid, the star lines trace over it, colour floods out ring by ring, and an endless zoom shows the same rosette nested inside itself.
- Visual DNA: Eight-fold stars and rosettes in lapis, turquoise, green and ochre glaze on cream, bound by dark interlacing straps edged in gold, with no figures at all.
- Signature transitions: Compass sweep, ripple trace, tile flood, Droste zoom, medallion iris
- Key techniques: Compass-and-straightedge build, Polygons-in-contact star pattern, Over-under strapwork & Droste zoom

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Compass-and-straightedge build, Polygons-in-contact star pattern, Over-under strapwork & Droste zoom).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Compass-and-straightedge build and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ISLAMIC GEOMETRY", held for about 1 s.

BUILD RULES
- Suggested tools: Compass & straightedge, Canvas 2D, Illustrator / Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Islamic Geometry motion-graphics film (Girih & Zellige). Visual style: eight-fold stars and rosettes in lapis, turquoise, green and ochre glaze on cream, bound by dark interlacing straps edged in gold, with no figures at all. Motion: everything is constructed before it is decorated: arcs and ruled lines draw a grid, the star lines trace over it, colour floods out ring by ring, and an endless zoom shows the same rosette nested inside itself. Signature moves: compass-and-straightedge build, polygons-in-contact star pattern, over-under strapwork & droste zoom; transitions: compass sweep, ripple trace, tile flood, Droste zoom, medallion iris. In the tradition of Alhambra zellige, Granada (14th c.) · Darb-i Imam shrine girih, Isfahan (1453) · Topkapı Scroll (15th–16th c.) · Ben Youssef Madrasa, Marrakesh (1560s) · Sheikh Lotfollah Mosque, Isfahan (1619). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ISLAMIC GEOMETRY". Punchy sound design synced to every cut.
```
