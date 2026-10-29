# Paper Craft

*Pop-up books and layered cut paper · 1760s — · Analog, Physical & Stop Motion*

Reference film: `videos/papercraft.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Paper Craft** (Pop-up books and layered cut paper, 1760s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Paper craft turns flat card into depth: layers cut with a blade are stacked a few millimetres apart so each casts a soft shadow on the next, and scored creases let a spread fold flat and spring up again. Movable books go back to Lothar Meggendorfer's pull-tab books of the 1880s and earlier flap books; paper engineers such as Robert Sabuda and Matthew Reinhart made the pop-up a showpiece, and the layered-diorama look became a staple of 2010s advertising and motion design, often shot frame by frame.
- Study these reference works: Lothar Meggendorfer — movable books (1880s–1900s) · Robert Sabuda — The Wonderful Wizard of Oz: A Commemorative Pop-up (2000) · Robert Sabuda & Matthew Reinhart — Encyclopedia Prehistorica: Dinosaurs (2005) · Masahiro Chatani — origamic architecture (1980s)
- Motion DNA: Mechanical, not animated: every movement is something paper can do — a cover lifts, layers rise together on parallel folds, a pull tab drives the sun along a slot, a strip slides a balloon up, an accordion unfolds — all stepped at twelve exposures a second with a little hand-placed jitter and a springy settle.
- Visual DNA: Matte pastel card on a warm tabletop: mint hills, sugared-almond houses, deep green trees, a coral banner; crisp cut edges, dashed score lines, soft shadows between layers and visible paper fibre.
- Signature transitions: Closed cover → book opens and the scene pops up → mechanisms play in turn → banner unfolds with the title
- Key techniques: Parallel-fold pop-up, Layered drop shadows, Stop-motion 12 fps step

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Parallel-fold pop-up, Layered drop shadows, Stop-motion 12 fps step).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Parallel-fold pop-up and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PAPER CRAFT", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-cut card, glue and a stop-motion camera, Cinema 4D / Blender paper rigs, After Effects 3D layers, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Paper Craft motion-graphics film (Pop-up books and layered cut paper). Visual style: matte pastel card on a warm tabletop: mint hills, sugared-almond houses, deep green trees, a coral banner; crisp cut edges, dashed score lines, soft shadows between layers and visible paper fibre. Motion: mechanical, not animated: every movement is something paper can do — a cover lifts, layers rise together on parallel folds, a pull tab drives the sun along a slot, a strip slides a balloon up, an accordion unfolds — all stepped at twelve exposures a second with a little hand-placed jitter and a springy settle. Signature moves: parallel-fold pop-up, layered drop shadows, stop-motion 12 fps step; transitions: closed cover → book opens and the scene pops up → mechanisms play in turn → banner unfolds with the title. In the tradition of Lothar Meggendorfer — movable books (1880s–1900s) · Robert Sabuda — The Wonderful Wizard of Oz: A Commemorative Pop-up (2000) · Robert Sabuda & Matthew Reinhart — Encyclopedia Prehistorica: Dinosaurs (2005) · Masahiro Chatani — origamic architecture (1980s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PAPER CRAFT". Punchy sound design synced to every cut.
```
