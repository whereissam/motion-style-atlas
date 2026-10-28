# Concert VJ Loops

*Live visuals for stage & club · 1990s — · Social & Commercial*

Reference film: `videos/vj.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Concert VJ Loops** (Live visuals for stage & club, 1990s —; family: Social & Commercial).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: VJs perform visuals live, triggering and mixing beat-locked loops on clip-launcher software (Resolume Arena, TouchDesigner, earlier VDMX and Modul8) onto LED walls and projection-mapped stage sets. The form grew out of club projection in the 1980s–90s; by the 2000s studios such as United Visual Artists built LED walls and custom software for Massive Attack, Daft Punk toured a light-up pyramid, and Amon Tobin’s ISAM stage turned a stack of cubes into a projection-mapped instrument.
- Study these reference works: UVA (United Visual Artists) — Massive Attack 100th Window tour LED wall (2003) and Heligoland tour (2010) · Daft Punk, Alive 2006/2007 pyramid stage · Amon Tobin, ISAM Live (2011), with Heavy Projects and V Squared Labs · Resolume Arena / TouchDesigner VJ sets in clubs and festivals
- Motion DNA: Everything is locked to the beat grid: loops cycle in bar lengths, kicks launch local rings rather than full-frame flashes, a build accelerates scroll speed and roll density, the drop changes clip on the downbeat and lasers fan on the bar.
- Visual DNA: A black stage with a wide LED wall of visible pixels, neon cyan, magenta and amber geometry — tunnels, data columns, nested triangles — bloom and floor reflections, a pyramid outline, a mapped cube booth, laser fans over a silhouetted crowd with raised hands and phone screens.
- Signature transitions: Dive through the software output preview onto the wall, clip cuts on the downbeat, scan sweeps, accelerating build, pulse decays, title resolved in LED pixels
- Key techniques: Clip launcher with BPM sync / tap tempo, LED wall mapping at low pixel pitch, Projection-mapped set pieces, Lasers and moving heads through haze

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Clip launcher with BPM sync / tap tempo, LED wall mapping at low pixel pitch, Projection-mapped set pieces, Lasers and moving heads through haze).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Clip launcher with BPM sync / tap tempo and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CONCERT VJ LOOPS", held for about 1 s.

BUILD RULES
- Suggested tools: Resolume Arena / TouchDesigner + LED processor, Notch / After Effects loop authoring, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Concert VJ Loops motion-graphics film (Live visuals for stage & club). Visual style: a black stage with a wide LED wall of visible pixels, neon cyan, magenta and amber geometry — tunnels, data columns, nested triangles — bloom and floor reflections, a pyramid outline, a mapped cube booth, laser fans over a silhouetted crowd with raised hands and phone screens. Motion: everything is locked to the beat grid: loops cycle in bar lengths, kicks launch local rings rather than full-frame flashes, a build accelerates scroll speed and roll density, the drop changes clip on the downbeat and lasers fan on the bar. Signature moves: clip launcher with bpm sync / tap tempo, led wall mapping at low pixel pitch, projection-mapped set pieces, lasers and moving heads through haze; transitions: dive through the software output preview onto the wall, clip cuts on the downbeat, scan sweeps, accelerating build, pulse decays, title resolved in LED pixels. In the tradition of UVA (United Visual Artists) — Massive Attack 100th Window tour LED wall (2003) and Heligoland tour (2010) · Daft Punk, Alive 2006/2007 pyramid stage · Amon Tobin, ISAM Live (2011), with Heavy Projects and V Squared Labs · Resolume Arena / TouchDesigner VJ sets in clubs and festivals. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CONCERT VJ LOOPS". Punchy sound design synced to every cut.
```
