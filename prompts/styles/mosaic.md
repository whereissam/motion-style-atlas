# Byzantine Mosaic

*Gold glass and tesserae · 5th–15th c. · Cultural & Regional*

Reference film: `videos/mosaic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Byzantine Mosaic** (Gold glass and tesserae, 5th–15th c.; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Byzantine mosaic builds images from tesserae, small cubes of stone and coloured glass, set in rows that follow the forms they describe (andamento) over grounds of gold-leaf glass that glint as the light or the viewer moves. In Ravenna the Mausoleum of Galla Placidia (c. 425–450) has a deep blue vault strewn with gold stars and San Vitale (c. 547) shows the court of Justinian and Theodora; the Deësis panel in Hagia Sophia (c. 1261) reached a painterly softness with very small tesserae.
- Study these reference works: Mausoleum of Galla Placidia, Ravenna (c. 425–450) · San Vitale, Justinian and Theodora panels, Ravenna (c. 547) · Hagia Sophia, Deësis panel, Constantinople (c. 1261) · Chora Church (Kariye), Constantinople (c. 1315–1321)
- Motion DNA: Accumulation, then light. Tiles are pressed in singly at first and then faster and faster in waves that run along their rows, outward from the figure; when the surface is whole nothing moves but a lamp, and the gold answers it tile by tile with glints that flicker on and off as the angle passes.
- Visual DNA: Small irregular squares with dark grout between; gold-glass ground laid in rows that halo the figure; a blue and green peacock with a dark outline row and eyed tail, vine scrolls with leaves and grapes, a deep lapis vault with eight-pointed gold stars under a red and white arch, a border of red with white diamonds and pearl beading; red-ochre sinopia on plaster where nothing is set yet.
- Signature transitions: Close-up pulls back as the surface fills; a lamp sweep; the title set in gold on the vault
- Key techniques: Rows follow the forms (andamento), Tilted gold smalti glint, Tesserae set one by one

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Rows follow the forms (andamento), Tilted gold smalti glint, Tesserae set one by one).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Rows follow the forms (andamento) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BYZANTINE MOSAIC", held for about 1 s.

BUILD RULES
- Suggested tools: Stone and gold- or colour-backed glass tesserae pressed into lime mortar over a painted sinopia, Canvas 2D: label masks, a distance field per region, greedy tile packing along its iso-lines, Per-tile tilt vectors for specular glints. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural homage.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Byzantine Mosaic motion-graphics film (Gold glass and tesserae). Visual style: small irregular squares with dark grout between; gold-glass ground laid in rows that halo the figure; a blue and green peacock with a dark outline row and eyed tail, vine scrolls with leaves and grapes, a deep lapis vault with eight-pointed gold stars under a red and white arch, a border of red with white diamonds and pearl beading; red-ochre sinopia on plaster where nothing is set yet. Motion: accumulation, then light. Tiles are pressed in singly at first and then faster and faster in waves that run along their rows, outward from the figure; when the surface is whole nothing moves but a lamp, and the gold answers it tile by tile with glints that flicker on and off as the angle passes. Signature moves: rows follow the forms (andamento), tilted gold smalti glint, tesserae set one by one; transitions: close-up pulls back as the surface fills; a lamp sweep; the title set in gold on the vault. In the tradition of Mausoleum of Galla Placidia, Ravenna (c. 425–450) · San Vitale, Justinian and Theodora panels, Ravenna (c. 547) · Hagia Sophia, Deësis panel, Constantinople (c. 1261) · Chora Church (Kariye), Constantinople (c. 1315–1321). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BYZANTINE MOSAIC". Punchy sound design synced to every cut.
```
