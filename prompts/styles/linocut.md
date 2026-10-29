# Linocut

*Carved, Inked and Pulled · 1918 — · 2D Animation & Illustration*

Reference film: `videos/linocut.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Linocut** (Carved, Inked and Pulled, 1918 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Relief printmaking set in motion: every white line is a groove gouged out of a wood or linoleum block, ink is rolled over what is left, and each frame is a fresh pull of paper. Frans Masereel’s wordless woodcut novels (from 1918) and Lynd Ward’s Gods’ Man (1929) told whole stories in successive prints, and Berthold Bartosch animated Masereel’s The Idea as L’Idée (1932) in cut-outs on layered glass; today linocut is cut frame by frame, or faked with carved textures, for music videos and title sequences.
- Study these reference works: 25 Images of a Man’s Passion (Frans Masereel, 1918) · The Sun (Frans Masereel, 1919) · The Idea (Frans Masereel, 1920) · Gods’ Man (Lynd Ward, 1929) · L’Idée (Berthold Bartosch, 1932; score by Arthur Honegger)
- Motion DNA: Motion as a stack of prints: the picture steps at 8 drawings a second, and every pull boils slightly — the ink takes differently, the paper sits a hair off; light is not painted but cut, so dawn arrives as gouges widening into rays, and a second colour registers in from slightly off its pins before it locks.
- Visual DNA: Dense black ink on cream laid paper with carved white tapered gouges — hatched skies, ray bursts, cobbled perspective, a figure isolated by a cut halo — a single red second block for the sun, rolled-ink mottling, registration crosses and pencil numbering in the margin.
- Signature transitions: A press roller passes to reveal the first pull; prints step on 8 fps; the sheet is pulled away and the title block is carved pull by pull
- Key techniques: Tapered gouge-mark carving, Two-block colour registration, One print per frame, on 8 fps

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Tapered gouge-mark carving, Two-block colour registration, One print per frame, on 8 fps).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Tapered gouge-mark carving and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LINOCUT", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-cut lino or woodblocks, one pulled print per frame (rostrum-shot), Cut-paper or glass-plane multiplane imitating woodcut (Bartosch), After Effects / Procreate with carved-texture brushes and stepped time, Canvas 2D: ink block filled then carved with destination-out tapered gouges, mottle punched per pull, red block multiplied under black with animated misregistration. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Linocut motion-graphics film (Carved, Inked and Pulled). Visual style: dense black ink on cream laid paper with carved white tapered gouges — hatched skies, ray bursts, cobbled perspective, a figure isolated by a cut halo — a single red second block for the sun, rolled-ink mottling, registration crosses and pencil numbering in the margin. Motion: motion as a stack of prints: the picture steps at 8 drawings a second, and every pull boils slightly — the ink takes differently, the paper sits a hair off; light is not painted but cut, so dawn arrives as gouges widening into rays, and a second colour registers in from slightly off its pins before it locks. Signature moves: tapered gouge-mark carving, two-block colour registration, one print per frame, on 8 fps; transitions: a press roller passes to reveal the first pull; prints step on 8 fps; the sheet is pulled away and the title block is carved pull by pull. In the tradition of 25 Images of a Man’s Passion (Frans Masereel, 1918) · The Sun (Frans Masereel, 1919) · The Idea (Frans Masereel, 1920) · Gods’ Man (Lynd Ward, 1929) · L’Idée (Berthold Bartosch, 1932; score by Arthur Honegger). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LINOCUT". Punchy sound design synced to every cut.
```
