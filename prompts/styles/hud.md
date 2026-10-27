# FUI

*Fantasy User Interface · 2008 — · Cinematic & Film Language*

Reference film: `videos/hud.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **FUI** (Fantasy User Interface, 2008 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Screen graphics designed for sci-fi films: interfaces that do not exist but look like they should.
- Study these reference works: Iron Man (2008) · The Martian (2015) · Blade Runner 2049 (2017)
- Motion DNA: Many small systems tick at different rates; everything converges on a single lock event.
- Visual DNA: Cyan and amber hairlines on near-black, glow, monospaced labels.
- Signature transitions: Boot-up, alert recolour, lock flash
- Key techniques: Segmented rings, Text decode, Target lock

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Segmented rings, Text decode, Target lock).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Segmented rings and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FUI", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, Unreal. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second FUI motion-graphics film (Fantasy User Interface). Visual style: cyan and amber hairlines on near-black, glow, monospaced labels. Motion: many small systems tick at different rates; everything converges on a single lock event. Signature moves: segmented rings, text decode, target lock; transitions: boot-up, alert recolour, lock flash. In the tradition of Iron Man (2008) · The Martian (2015) · Blade Runner 2049 (2017). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FUI". Punchy sound design synced to every cut.
```
