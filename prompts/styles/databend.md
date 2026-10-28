# Databending

*Corrupting the file, not the picture · 2000s — · Digital, Internet & Screen*

Reference film: `videos/databend.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Databending** (Corrupting the file, not the picture, 2000s —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Databending treats an image or video file as raw data and breaks it on purpose: bytes are overwritten in a hex or text editor, the file is opened as audio and run through effects, or a compressed video loses its keyframes so motion from one shot drags the pixels of another (datamoshing). It grew from circuit bending and net art in the early 2000s; Takeshi Murata’s Monster Movie (2005) and Rosa Menkman’s The Collapse of PAL (2010) and Glitch Moment/um (2011) made the compression artefacts themselves the subject, and datamosh reached music videos in the late 2000s.
- Study these reference works: Monster Movie (Takeshi Murata, 2005) · Untitled (Pink Dot) (Takeshi Murata, 2007) · The Collapse of PAL (Rosa Menkman, 2010) · A Vernacular of File Formats (Rosa Menkman, 2010) · Welcome to Heartbreak (Kanye West, dir. Nabil Elderkin, 2009)
- Motion DNA: Damage propagates in the order the decoder reads: a single changed byte slides everything after it, a deleted keyframe lets the next shot’s motion vectors push the last picture around so pixels bloom, smear and swirl in blocks, and the decay only ever moves forward until a clean keyframe resets it.
- Visual DNA: A real, colourful photograph broken along its compression grid: 8×8 blocks out of step with colour casts, stray DCT stripes, decoder grey where data ran out, blocky macroblock trails, banded rows where audio effects shifted bytes, plus the tools themselves — hex dumps, frame-type strips, a waveform.
- Signature transitions: Block-by-block decode, hex edit with decoder sweep, deleted I-frame into P-frame bleed, raw-audio echo, clean I-frame reset, drip
- Key techniques: JPEG block slip & DC shift, I-frame removal datamosh, Raw-audio echo on RGB bytes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (JPEG block slip & DC shift, I-frame removal datamosh, Raw-audio echo on RGB bytes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on JPEG block slip & DC shift and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DATABENDING", held for about 1 s.

BUILD RULES
- Suggested tools: Hex editor / text editor on JPEG and BMP, Audacity raw import and export, Avidemux / FFmpeg keyframe removal, Canvas 2D (per-block pixel buffers). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Databending motion-graphics film (Corrupting the file, not the picture). Visual style: a real, colourful photograph broken along its compression grid: 8×8 blocks out of step with colour casts, stray DCT stripes, decoder grey where data ran out, blocky macroblock trails, banded rows where audio effects shifted bytes, plus the tools themselves — hex dumps, frame-type strips, a waveform. Motion: damage propagates in the order the decoder reads: a single changed byte slides everything after it, a deleted keyframe lets the next shot’s motion vectors push the last picture around so pixels bloom, smear and swirl in blocks, and the decay only ever moves forward until a clean keyframe resets it. Signature moves: jpeg block slip & dc shift, i-frame removal datamosh, raw-audio echo on rgb bytes; transitions: block-by-block decode, hex edit with decoder sweep, deleted I-frame into P-frame bleed, raw-audio echo, clean I-frame reset, drip. In the tradition of Monster Movie (Takeshi Murata, 2005) · Untitled (Pink Dot) (Takeshi Murata, 2007) · The Collapse of PAL (Rosa Menkman, 2010) · A Vernacular of File Formats (Rosa Menkman, 2010) · Welcome to Heartbreak (Kanye West, dir. Nabil Elderkin, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DATABENDING". Punchy sound design synced to every cut.
```
