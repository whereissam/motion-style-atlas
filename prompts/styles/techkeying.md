# Keying

*Pull a matte from a colour, then replace it · 1940 — · Technique Atlas*

Reference film: `videos/techkeying.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Keying** (Pull a matte from a colour, then replace it, 1940 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Blue-screen travelling mattes were pioneered by Larry Butler for The Thief of Bagdad (1940), and Petro Vlahos refined the colour-difference process (and later the Ultimatte electronic keyer) whose idea — the matte is how much the backing colour exceeds the other channels — every digital keyer still uses. Green became the usual backing with digital video sensors, and keying grew its standard controls: clip black and white to clean the matte, and spill suppression to remove backing colour reflected onto the subject.
- Study these reference works: The Thief of Bagdad (1940; Larry Butler’s blue-screen mattes) · Ben-Hur (1959; Petro Vlahos’s colour-difference blue screen) · Mary Poppins (1964; the sodium-vapour matte process)
- Motion DNA: The Token drifts slowly left and right on the green screen while the keyer, not the subject, does the moving: one-bar wipes swap RAW for MATTE and MATTE for COMP, the clip values ease over one bar so the grey matte snaps clean, a slow wipe turns despill on across the frame, and two dividers slide in to hold a three-way split the Token crosses.
- Visual DNA: A 16:9 viewer on the Technique Atlas stage showing a drawn green-screen plate (hot spot, dark corners, a fold, dark tracking crosses, sensor noise, green rim on the orange Token), its black-and-white matte and the composite on the paper-and-grid stage; orange wipe dividers with view chips; a keyer panel on the right with clip values, despill state, formulas and a live transfer curve; a loupe on the Token edge showing the green fringe.
- Signature transitions: Hard-edged wipes between RAW, MATTE and COMP; a three-way split
- Key techniques: Colour-difference matte, Clip black / clip white, Spill suppression

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Colour-difference matte, Clip black / clip white, Spill suppression).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Colour-difference matte and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "KEYING", held for about 1 s.

BUILD RULES
- Suggested tools: Ultimatte / Primatte / Keylight colour-difference keyers, Nuke Keylight + IBK, After Effects Keylight with spill suppression, Canvas 2D: per-pixel key on a 640 × 360 canvas (getImageData), scaled 2× into the viewer. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Keying motion-graphics film (Pull a matte from a colour, then replace it). Visual style: a 16:9 viewer on the Technique Atlas stage showing a drawn green-screen plate (hot spot, dark corners, a fold, dark tracking crosses, sensor noise, green rim on the orange Token), its black-and-white matte and the composite on the paper-and-grid stage; orange wipe dividers with view chips; a keyer panel on the right with clip values, despill state, formulas and a live transfer curve; a loupe on the Token edge showing the green fringe. Motion: the Token drifts slowly left and right on the green screen while the keyer, not the subject, does the moving: one-bar wipes swap RAW for MATTE and MATTE for COMP, the clip values ease over one bar so the grey matte snaps clean, a slow wipe turns despill on across the frame, and two dividers slide in to hold a three-way split the Token crosses. Signature moves: colour-difference matte, clip black / clip white, spill suppression; transitions: hard-edged wipes between RAW, MATTE and COMP; a three-way split. In the tradition of The Thief of Bagdad (1940; Larry Butler’s blue-screen mattes) · Ben-Hur (1959; Petro Vlahos’s colour-difference blue screen) · Mary Poppins (1964; the sodium-vapour matte process). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "KEYING". Punchy sound design synced to every cut.
```
