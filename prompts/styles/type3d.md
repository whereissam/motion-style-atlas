# 3D Typography

*Extruded Letterforms · 1978 — · Typography & Text Motion*

Reference film: `videos/type3d.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **3D Typography** (Extruded Letterforms, 1978 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Grew out of the late-1970s and 1980s broadcast idents, when studios such as Robert Abel and Associates and Pacific Data Images flew chrome and extruded logos through computer-generated space; Cinema 4D and real-time engines later made it a staple of title design.
- Study these reference works: Superman title sequence (R/Greenberg Associates, 1978) · Robert Abel & Associates broadcast idents (1980s) · 20th Century Fox logo (CG version, 1994) · Universal Pictures logo (CG version, 1997)
- Motion DNA: Heavy letters tumble in with weight and bounce, the camera orbits to prove they are solid, then everything locks into a frontal hero lockup.
- Visual DNA: Chrome faces with horizon-band reflections on saturated plastic sides, dark studio cyclorama, glossy floor reflection, lens glint.
- Signature transitions: Drop-and-bounce landings, domino flips, camera whip-pan, glint sweep on the lock.
- Key techniques: Affine-projected glyph planes, Perspective layer-stack extrusion, Chrome env-band shading + floor reflection

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Affine-projected glyph planes, Perspective layer-stack extrusion, Chrome env-band shading + floor reflection).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Affine-projected glyph planes and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "3D TYPOGRAPHY", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D, Three.js, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second 3D Typography motion-graphics film (Extruded Letterforms). Visual style: chrome faces with horizon-band reflections on saturated plastic sides, dark studio cyclorama, glossy floor reflection, lens glint. Motion: heavy letters tumble in with weight and bounce, the camera orbits to prove they are solid, then everything locks into a frontal hero lockup. Signature moves: affine-projected glyph planes, perspective layer-stack extrusion, chrome env-band shading + floor reflection; transitions: drop-and-bounce landings, domino flips, camera whip-pan, glint sweep on the lock. In the tradition of Superman title sequence (R/Greenberg Associates, 1978) · Robert Abel & Associates broadcast idents (1980s) · 20th Century Fox logo (CG version, 1994) · Universal Pictures logo (CG version, 1997). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "3D TYPOGRAPHY". Punchy sound design synced to every cut.
```
