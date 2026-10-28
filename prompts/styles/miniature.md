# Indian Miniature

*Mughal · Rajput · Pahari painting · 16th–19th c. · Cultural & Regional*

Reference film: `videos/miniature.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Indian Miniature** (Mughal · Rajput · Pahari painting, 16th–19th c.; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Album and manuscript painting of the Mughal court (from Akbar’s atelier in the 1560s) and of the Rajput kingdoms of Rajasthan and the Pahari hill states of the Punjab Himalaya. Painters burnished wasli paper, sketched a red-ochre khaka, laid mineral and lake pigments in flat layers and finished with gold; Persian conventions — a high horizon, tilted ground planes, cypress and garden — met Indian devotional subjects, above all the love of Radha and Krishna in the Gita Govinda and Bhagavata Purana.
- Study these reference works: Hamzanama for Akbar (c. 1562–77) · Jahangir album pages with gold-flowered hashiya margins (c. 1610–20) · Nainsukh of Guler, paintings for Balwant Singh of Jasrota (c. 1740s–50s) · Kangra Gita Govinda series (c. 1775–80) · Kishangarh “Bani Thani” type, Nihal Chand (c. 1750)
- Motion DNA: The painting is built the way a workshop built it — rules drawn, margin burnished, khaka sketched, colour laid layer by layer, gold applied last — then only gentle, devotional motion: a flute raised, a veil lifting, a peacock’s call, ripples in the tank, cranes crossing the sky.
- Visual DNA: A high-horizon garden terrace shown from above with upright profile figures, white marble pavilions with cusped arches and chhatris, rounded trees of countless leaves, jewel-tone lapis, vermilion and malachite on cream, fine dark outlines and glinting gold, inside rules, a lapis vine border and a gold-flowered hashiya.
- Signature transitions: Ruling-pen line draw, khaka-to-colour layering, gold-leaf sweep with sheen, slow camera glide across the folio, pull-back to the album page and its inscription
- Key techniques: Burnished wasli paper, red khaka underdrawing, Flat mineral pigments (lapis, malachite, vermilion, Indian yellow), Gold leaf and shell gold, burnished, Tilted perspective, profile figures, ornate hashiya margins

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Burnished wasli paper, red khaka underdrawing, Flat mineral pigments (lapis, malachite, vermilion, Indian yellow), Gold leaf and shell gold, burnished, Tilted perspective, profile figures, ornate hashiya margins).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Burnished wasli paper, red khaka underdrawing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INDIAN MINIATURE", held for about 1 s.

BUILD RULES
- Suggested tools: Mineral pigment and gold on wasli, Illustrator / Procreate + AE layered reveal, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Indian Miniature motion-graphics film (Mughal · Rajput · Pahari painting). Visual style: a high-horizon garden terrace shown from above with upright profile figures, white marble pavilions with cusped arches and chhatris, rounded trees of countless leaves, jewel-tone lapis, vermilion and malachite on cream, fine dark outlines and glinting gold, inside rules, a lapis vine border and a gold-flowered hashiya. Motion: the painting is built the way a workshop built it — rules drawn, margin burnished, khaka sketched, colour laid layer by layer, gold applied last — then only gentle, devotional motion: a flute raised, a veil lifting, a peacock’s call, ripples in the tank, cranes crossing the sky. Signature moves: burnished wasli paper, red khaka underdrawing, flat mineral pigments (lapis, malachite, vermilion, indian yellow), gold leaf and shell gold, burnished, tilted perspective, profile figures, ornate hashiya margins; transitions: ruling-pen line draw, khaka-to-colour layering, gold-leaf sweep with sheen, slow camera glide across the folio, pull-back to the album page and its inscription. In the tradition of Hamzanama for Akbar (c. 1562–77) · Jahangir album pages with gold-flowered hashiya margins (c. 1610–20) · Nainsukh of Guler, paintings for Balwant Singh of Jasrota (c. 1740s–50s) · Kangra Gita Govinda series (c. 1775–80) · Kishangarh “Bani Thani” type, Nihal Chand (c. 1750). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INDIAN MINIATURE". Punchy sound design synced to every cut.
```
