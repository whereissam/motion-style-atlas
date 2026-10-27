# Split-screen Cinema

*Everything at Once · 1968 — · Cinematic & Film Language*

Reference film: `videos/splitscreen.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Split-screen Cinema** (Everything at Once, 1968 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Split screen divides one frame into simultaneous shots. Abel Gance used multi-screen in Napoléon (1927); designer-director Pablo Ferro's multi-panel montages for Norman Jewison's The Thomas Crown Affair (1968) made it a thriller grammar, Brian De Palma used it for suspense, the TV series 24 (2001) built its clock-driven identity on it, and Mike Figgis's Timecode (2000) told a whole film in four continuous quadrants.
- Study these reference works: The Thomas Crown Affair (Norman Jewison, montage by Pablo Ferro, 1968) · Grand Prix (John Frankenheimer, titles by Saul Bass, 1966) · Carrie (Brian De Palma, 1976) · Timecode (Mike Figgis, 2000) · 24 (Fox, 2001–2010) · (500) Days of Summer (Marc Webb, 2009)
- Motion DNA: The frame divides on the beat — 1, 2, 4, 9, 16 — with panels sliding and resizing like a tightening vice; every panel ticks to the same countdown until all converge on one shot and merge into a single full frame at zero.
- Visual DNA: Black gutters that flash red, a red telephone, a station clock, rain-wet streets, headlights, a CCTV feed, LED digits, a vault dial and a lit phone booth: noir teal and amber with signal-red accents, panel labels in mono.
- Signature transitions: Split, slide, resize, squeeze-to-hero, merge-to-full-frame white-out, title split by a sliding gutter.
- Key techniques: Grid as per-row column boundaries: panels split, slide and resize by interpolating edges, Sixteen procedural shots in a cover-fit virtual frame, All shots slaved to one countdown clock, Red gutter flash and slam on each split; staggered row slides, Squeeze-to-hero merge into one full frame at zero

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Grid as per-row column boundaries: panels split, slide and resize by interpolating edges, Sixteen procedural shots in a cover-fit virtual frame, All shots slaved to one countdown clock, Red gutter flash and slam on each split; staggered row slides, Squeeze-to-hero merge into one full frame at zero).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Grid as per-row column boundaries: panels split, slide and resize by interpolating edges and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "SPLIT-SCREEN CINEMA", held for about 1 s.

BUILD RULES
- Suggested tools: Optical printer / multi-camera, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Split-screen Cinema motion-graphics film (Everything at Once). Visual style: black gutters that flash red, a red telephone, a station clock, rain-wet streets, headlights, a CCTV feed, LED digits, a vault dial and a lit phone booth: noir teal and amber with signal-red accents, panel labels in mono. Motion: the frame divides on the beat — 1, 2, 4, 9, 16 — with panels sliding and resizing like a tightening vice; every panel ticks to the same countdown until all converge on one shot and merge into a single full frame at zero. Signature moves: grid as per-row column boundaries: panels split, slide and resize by interpolating edges, sixteen procedural shots in a cover-fit virtual frame, all shots slaved to one countdown clock, red gutter flash and slam on each split; staggered row slides, squeeze-to-hero merge into one full frame at zero; transitions: split, slide, resize, squeeze-to-hero, merge-to-full-frame white-out, title split by a sliding gutter. In the tradition of The Thomas Crown Affair (Norman Jewison, montage by Pablo Ferro, 1968) · Grand Prix (John Frankenheimer, titles by Saul Bass, 1966) · Carrie (Brian De Palma, 1976) · Timecode (Mike Figgis, 2000) · 24 (Fox, 2001–2010) · (500) Days of Summer (Marc Webb, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "SPLIT-SCREEN CINEMA". Punchy sound design synced to every cut.
```
