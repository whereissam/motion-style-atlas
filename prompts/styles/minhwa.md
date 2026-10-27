# Minhwa 민화

*Korean Folk Painting · 18th–19th c. — · Cultural & Regional*

Reference film: `videos/minhwa.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Minhwa 민화** (Korean Folk Painting, 18th–19th c. —; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In late Joseon Korea, anonymous itinerant painters made “people’s paintings” for ordinary homes: magpie-and-tiger pictures to ward off evil at New Year, chaekgeori bookshelf screens, peonies for wealth and the ten symbols of longevity. Flat mineral colour, firm ink outlines and a cheerfully foolish tiger set them apart from court painting; Yanagi Muneyoshi championed them, and the 2018 PyeongChang Olympic mascot Soohorang descends from that tiger.
- Study these reference works: Magpie and Tiger (Kkachi Horangi), 19th c., Leeum Museum of Art · Chaekgeori screens attributed to Yi Eung-rok (19th c.) · Sipjangsaeng ten-longevity screens (Joseon court and folk) · Moran-do peony screens · Soohorang, PyeongChang 2018 mascot
- Motion DNA: Paper-cut-out stiffness with comic timing: the tiger pops up on a spring and rolls its huge eyes, the magpie hops and caws, peonies burst open, and screen panels unfold in a zigzag.
- Visual DNA: Outlined, flattened forms in vermilion, ochre, malachite and indigo on yellowed hanji: a striped-and-spotted grinning tiger under a pine, a black-and-white magpie, scalloped peonies and stylised rocks.
- Signature transitions: Ink-then-colour reveal, scroll-viewing tilt, pull-back to a folding screen, panels unfolding, red seal stamp
- Key techniques: Ink outline, flat mineral colour, Obangsaek five-colour palette, Multi-perspective composition, Folding-screen (byeongpung) format

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Ink outline, flat mineral colour, Obangsaek five-colour palette, Multi-perspective composition, Folding-screen (byeongpung) format).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Ink outline, flat mineral colour and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MINHWA 민화", held for about 1 s.

BUILD RULES
- Suggested tools: Mineral pigment on hanji, Illustrator / Procreate + AE puppet, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Minhwa 민화 motion-graphics film (Korean Folk Painting). Visual style: outlined, flattened forms in vermilion, ochre, malachite and indigo on yellowed hanji: a striped-and-spotted grinning tiger under a pine, a black-and-white magpie, scalloped peonies and stylised rocks. Motion: paper-cut-out stiffness with comic timing: the tiger pops up on a spring and rolls its huge eyes, the magpie hops and caws, peonies burst open, and screen panels unfold in a zigzag. Signature moves: ink outline, flat mineral colour, obangsaek five-colour palette, multi-perspective composition, folding-screen (byeongpung) format; transitions: ink-then-colour reveal, scroll-viewing tilt, pull-back to a folding screen, panels unfolding, red seal stamp. In the tradition of Magpie and Tiger (Kkachi Horangi), 19th c., Leeum Museum of Art · Chaekgeori screens attributed to Yi Eung-rok (19th c.) · Sipjangsaeng ten-longevity screens (Joseon court and folk) · Moran-do peony screens · Soohorang, PyeongChang 2018 mascot. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MINHWA 민화". Punchy sound design synced to every cut.
```
