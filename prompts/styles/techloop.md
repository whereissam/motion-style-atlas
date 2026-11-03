# Seamless Loop

*The last frame leads back into the first · 1830s — · Technique Atlas*

Reference film: `videos/techloop.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Seamless Loop** (The last frame leads back into the first, 1830s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Optical toys of the 1830s — Joseph Plateau’s phenakistiscope (1833) and the zoetrope — could only show cycles: a ring of drawings whose last leads straight back into the first. Hand-drawn animation kept walk and run cycles as a basic economy. Netscape Navigator 2.0 (1995) added a looping extension to the GIF format, making the endless loop a native form of the web; After Effects expressions (version 5.0, 2001) brought loopOut("cycle") and loopOut("pingpong") for repeating keyframes, and cinemagraphs (2011) and looping GIF art made the invisible seam the whole point.
- Study these reference works: Phenakistiscope discs (Joseph Plateau, 1833) · The Dancing Baby (1996) · Cinemagraphs (Jamie Beck and Kevin Burg, 2011)
- Motion DNA: Everything runs on one 2-second clock — a bar of the 120 BPM bed — and the film is exactly five of them. The hero bobs on a sine for all ten seconds; a lane eased from left to right snaps back at the seam with a click, then slides on a sine and never snaps again; seven Tokens ripple a seventh of a cycle apart; a hop keyed as one big and one small jump repeats by loopOut. The last frame leads into the first.
- Visual DNA: The Technique Atlas stage: the hero Token bobbing over a soft contact shadow on the left, a cycle ring top-right with an orange progress arc, a frame counter and an ink seam bar at twelve; an inset comparing frame 0 (filled) with frame 60 (dashed) and a Δ readout; a five-cell filmstrip, a lane with key diamonds, mono formulas, a sine row of seven Tokens, and a keyframe graph whose authored cycle is solid and its repeats dashed.
- Signature transitions: Section cross-fades on the cycle clock; the last section fades back into the first so the film loops
- Key techniques: Frame N ≡ frame 0, Periodic functions sin(2π·t/T), Phase offsets · loopOut("cycle")

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Frame N ≡ frame 0, Periodic functions sin(2π·t/T), Phase offsets · loopOut("cycle")).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Frame N ≡ frame 0 and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SEAMLESS LOOP", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects loopOut("cycle") / loopOut("pingpong") and time-based sin(2π·time/T) expressions, Animated GIF / video loops exported with the duplicate end frame dropped, Canvas 2D: every motion a function of t mod T. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Seamless Loop motion-graphics film (The last frame leads back into the first). Visual style: the Technique Atlas stage: the hero Token bobbing over a soft contact shadow on the left, a cycle ring top-right with an orange progress arc, a frame counter and an ink seam bar at twelve; an inset comparing frame 0 (filled) with frame 60 (dashed) and a Δ readout; a five-cell filmstrip, a lane with key diamonds, mono formulas, a sine row of seven Tokens, and a keyframe graph whose authored cycle is solid and its repeats dashed. Motion: everything runs on one 2-second clock — a bar of the 120 BPM bed — and the film is exactly five of them. The hero bobs on a sine for all ten seconds; a lane eased from left to right snaps back at the seam with a click, then slides on a sine and never snaps again; seven Tokens ripple a seventh of a cycle apart; a hop keyed as one big and one small jump repeats by loopOut. The last frame leads into the first. Signature moves: frame n ≡ frame 0, periodic functions sin(2π·t/t), phase offsets · loopout("cycle"); transitions: section cross-fades on the cycle clock; the last section fades back into the first so the film loops. In the tradition of Phenakistiscope discs (Joseph Plateau, 1833) · The Dancing Baby (1996) · Cinemagraphs (Jamie Beck and Kevin Burg, 2011). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SEAMLESS LOOP". Punchy sound design synced to every cut.
```
