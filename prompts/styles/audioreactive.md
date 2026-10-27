# Audio Reactive

*Music Drives the Picture · 1998 — · Experimental & Generative*

Reference film: `videos/audioreactive.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Audio Reactive** (Music Drives the Picture, 1998 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Real-time visuals computed from sound: Winamp’s visualiser plug-ins (AVS 1999, Ryan Geiss’s MilkDrop 2001) put FFT-driven feedback art on every PC, VJ culture took it to club screens, and Ryoji Ikeda turned raw signal and data into monumental minimalist audiovisual works.
- Study these reference works: Ryan Geiss — MilkDrop (2001) · Nullsoft Winamp AVS (1999) · Ryoji Ikeda — test pattern (2008) & datamatics (2006) · Robert Hodgin — Magnetosphere / iTunes visualiser (2008) · Carsten Nicolai (alva noto) — unitxt (2008)
- Motion DNA: Nothing moves on its own: every pulse, zoom, flash and burst is an envelope of a kick, snare, hat or note, so motion lands exactly on the beat.
- Visual DNA: Ikeda monochrome — hairlines, barcodes and data readouts on black — exploding at the drop into MilkDrop’s saturated plasma, mirrored spectra and feedback tunnels.
- Signature transitions: Barcode strobe, inversion flash, build zoom, blackout breath, drop explosion, collapse to data
- Key techniques: Event list shared by score & picture, FFT-style radial spectrum & peak caps, Feedback tunnel, kick zoom, snare bursts

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Event list shared by score & picture, FFT-style radial spectrum & peak caps, Feedback tunnel, kick zoom, snare bursts).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Event list shared by score & picture and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "AUDIO REACTIVE", held for about 1 s.

BUILD RULES
- Suggested tools: Web Audio + Canvas 2D, TouchDesigner, GLSL (MilkDrop presets). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Audio Reactive motion-graphics film (Music Drives the Picture). Visual style: ikeda monochrome — hairlines, barcodes and data readouts on black — exploding at the drop into MilkDrop’s saturated plasma, mirrored spectra and feedback tunnels. Motion: nothing moves on its own: every pulse, zoom, flash and burst is an envelope of a kick, snare, hat or note, so motion lands exactly on the beat. Signature moves: event list shared by score & picture, fft-style radial spectrum & peak caps, feedback tunnel, kick zoom, snare bursts; transitions: barcode strobe, inversion flash, build zoom, blackout breath, drop explosion, collapse to data. In the tradition of Ryan Geiss — MilkDrop (2001) · Nullsoft Winamp AVS (1999) · Ryoji Ikeda — test pattern (2008) & datamatics (2006) · Robert Hodgin — Magnetosphere / iTunes visualiser (2008) · Carsten Nicolai (alva noto) — unitxt (2008). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "AUDIO REACTIVE". Punchy sound design synced to every cut.
```
