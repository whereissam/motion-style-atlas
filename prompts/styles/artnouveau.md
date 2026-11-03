# Art Nouveau

*The Whiplash Line · 1890 — 1910 · Graphic Design & Historical*

Reference film: `videos/artnouveau.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Art Nouveau** (The Whiplash Line, 1890 — 1910; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Art Nouveau took its name from Siegfried Bing’s Paris shop, the Maison de l’Art Nouveau (1895), and spread across Europe as Jugendstil, Secession and Modernisme: a total style that let one living line run through posters, ironwork, glass, furniture and buildings. Alphonse Mucha’s posters framed women in halos and flowing hair, Victor Horta and Hector Guimard bent iron into plant stems, and Tiffany Studios set opalescent glass in lead.
- Study these reference works: Gismonda poster (Alphonse Mucha, 1894) · Job cigarette-paper poster (Mucha, 1896) · Hôtel Tassel, Brussels (Victor Horta, 1893) · Paris Métro entrances (Hector Guimard, 1900)
- Motion DNA: Nothing is placed, everything grows: stalks rise and bow over, shoots uncurl, leaves unfold along vines, hair pours out in waves that travel down each strand and wind into spirals, while the whole poster breathes with a slow sway and the light moves through the glass.
- Visual DNA: Muted olive, sage, ochre, dusty rose and gold on cream, with brown ink outlines of varying weight; a woman in profile against a circular halo, macaroni curls, lilies and poppies, verdigris cast iron with orange glass lamps, a gilt mosaic band and a rounded title cartouche.
- Signature transitions: Border rule draw-on, organic growth from the frame edges, top-down glass lighting, ink-outline reveal, letter-by-letter rise
- Key techniques: Grown whiplash ribbons, Pane-by-pane leaded glass, Ink-line draw-on

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Grown whiplash ribbons, Pane-by-pane leaded glass, Ink-line draw-on).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Grown whiplash ribbons and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ART NOUVEAU", held for about 1 s.

BUILD RULES
- Suggested tools: Lithographic poster artwork, hand-inked, Illustrator + After Effects shape growth, Canvas 2D (procedural whiplash ribbons). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Art Nouveau motion-graphics film (The Whiplash Line). Visual style: muted olive, sage, ochre, dusty rose and gold on cream, with brown ink outlines of varying weight; a woman in profile against a circular halo, macaroni curls, lilies and poppies, verdigris cast iron with orange glass lamps, a gilt mosaic band and a rounded title cartouche. Motion: nothing is placed, everything grows: stalks rise and bow over, shoots uncurl, leaves unfold along vines, hair pours out in waves that travel down each strand and wind into spirals, while the whole poster breathes with a slow sway and the light moves through the glass. Signature moves: grown whiplash ribbons, pane-by-pane leaded glass, ink-line draw-on; transitions: border rule draw-on, organic growth from the frame edges, top-down glass lighting, ink-outline reveal, letter-by-letter rise. In the tradition of Gismonda poster (Alphonse Mucha, 1894) · Job cigarette-paper poster (Mucha, 1896) · Hôtel Tassel, Brussels (Victor Horta, 1893) · Paris Métro entrances (Hector Guimard, 1900). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ART NOUVEAU". Punchy sound design synced to every cut.
```
