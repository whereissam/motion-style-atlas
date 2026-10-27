# Cyanotype Motion

*Prussian-Blue Sun Prints · 1842 — · Analog, Physical & Stop Motion*

Reference film: `videos/cyanotype.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cyanotype Motion** (Prussian-Blue Sun Prints, 1842 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Paper brushed with iron salts turns Prussian blue where sunlight reaches it; objects laid on top stay white once the print is washed in water. John Herschel invented the process in 1842 and Anna Atkins used it for the first book illustrated with photographs.
- Study these reference works: Photographs of British Algae: Cyanotype Impressions (Anna Atkins, 1843–53) · Cyanotypes of British and Foreign Ferns (Anna Atkins & Anne Dixon, 1853) · cyanotype photograms by Bertha Evelyn Jaques (c. 1906)
- Motion DNA: Slow stop-motion: specimens are nudged between exposures, the blue builds with the light, and the wash reveals the picture in one sweep.
- Visual DNA: White botanical silhouettes on deep Prussian blue, with brushed edges, uneven emulsion, paper fibre and faint ghosts of earlier positions.
- Signature transitions: Brush coat, stepped rearrangement, sun burst, water wash, dry-down
- Key techniques: Brush-coated emulsion, Contact exposure under glass, Water-wash development

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Brush-coated emulsion, Contact exposure under glass, Water-wash development).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Brush-coated emulsion and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CYANOTYPE MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Sensitised paper + sunlight, Contact frame + water bath, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cyanotype Motion motion-graphics film (Prussian-Blue Sun Prints). Visual style: white botanical silhouettes on deep Prussian blue, with brushed edges, uneven emulsion, paper fibre and faint ghosts of earlier positions. Motion: slow stop-motion: specimens are nudged between exposures, the blue builds with the light, and the wash reveals the picture in one sweep. Signature moves: brush-coated emulsion, contact exposure under glass, water-wash development; transitions: brush coat, stepped rearrangement, sun burst, water wash, dry-down. In the tradition of Photographs of British Algae: Cyanotype Impressions (Anna Atkins, 1843–53) · Cyanotypes of British and Foreign Ferns (Anna Atkins & Anne Dixon, 1853) · cyanotype photograms by Bertha Evelyn Jaques (c. 1906). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CYANOTYPE MOTION". Punchy sound design synced to every cut.
```
