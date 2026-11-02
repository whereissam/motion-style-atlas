# Masking

*Show a layer only where another shape says so · 1900s — · Technique Atlas*

Reference film: `videos/techmasking.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Masking** (Show a layer only where another shape says so, 1900s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In-camera masks — a card in front of the lens, then a matte box exposing one part of the frame at a time — let early filmmakers such as Edwin S. Porter in The Great Train Robbery (1903) combine images; optical printers with travelling mattes made the matte a moving, frame-by-frame element. Digital compositing turned masks into editable bezier shapes with modes, feather and inversion, and desktop compositors such as After Effects made the other trick a one-click layer setting: the track matte, where one layer’s alpha or luminance sets another layer’s opacity.
- Study these reference works: Un homme de têtes (Georges Méliès, 1898; masked multiple exposures) · The Great Train Robbery (Edwin S. Porter, 1903; matted-in backgrounds) · Catch Me If You Can title sequence (Kuntzel + Deygas, 2002)
- Motion DNA: The plate never moves except the Token turning slowly; only the masks do. Each mode gets about a bar: two masks slide toward each other and merge, a round hole travels a sine path through a big mask, the edge softens from 0 to 90 px, the mask snaps inside-out and drifts, the word MOTION scales up as an alpha matte, and a bright band sweeps along a luma matte.
- Visual DNA: The Technique Atlas stage with a hidden ink plate (dashed ghost of its Token and card); mask outlines in orange with square vertices and dashed feather bounds; a mask-stack readout under the tag (mask, mode, feather, inverted); a black-and-white matte inset top right.
- Signature transitions: Hard cuts between mask modes on the beat; matte changes in place
- Key techniques: Mask modes: add · subtract, Feather and invert, Alpha and luma track mattes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mask modes: add · subtract, Feather and invert, Alpha and luma track mattes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mask modes: add · subtract and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MASKING", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects masks (Add / Subtract / Feather / Inverted) and track mattes, Nuke Roto + Merge (mask), Shuffle for luma, Canvas 2D: mask canvas applied with destination-in; luma → alpha on a half-res canvas. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Masking motion-graphics film (Show a layer only where another shape says so). Visual style: the Technique Atlas stage with a hidden ink plate (dashed ghost of its Token and card); mask outlines in orange with square vertices and dashed feather bounds; a mask-stack readout under the tag (mask, mode, feather, inverted); a black-and-white matte inset top right. Motion: the plate never moves except the Token turning slowly; only the masks do. Each mode gets about a bar: two masks slide toward each other and merge, a round hole travels a sine path through a big mask, the edge softens from 0 to 90 px, the mask snaps inside-out and drifts, the word MOTION scales up as an alpha matte, and a bright band sweeps along a luma matte. Signature moves: mask modes: add · subtract, feather and invert, alpha and luma track mattes; transitions: hard cuts between mask modes on the beat; matte changes in place. In the tradition of Un homme de têtes (Georges Méliès, 1898; masked multiple exposures) · The Great Train Robbery (Edwin S. Porter, 1903; matted-in backgrounds) · Catch Me If You Can title sequence (Kuntzel + Deygas, 2002). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MASKING". Punchy sound design synced to every cut.
```
