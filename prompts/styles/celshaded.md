# Cel-shaded 3D

*Toon Shading · 2000 — · 3D & CGI Motion*

Reference film: `videos/celshaded.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Cel-shaded 3D** (Toon Shading, 2000 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Non-photorealistic rendering that makes 3D models look like inked animation cels: diffuse light is quantised into two or three hard bands through a ramp lookup, and black outlines come from the inverted-hull trick (the back faces of a slightly inflated copy) or from edge detection. Sega's Jet Set Radio (Smilebit, 2000) brought it to games, Nintendo's The Legend of Zelda: The Wind Waker (2002) made it a classic, and it runs through Borderlands (2009), Guilty Gear Xrd (2014) and the NPR films Spider-Man: Into the Spider-Verse (2018) and Arcane (2021).
- Study these reference works: Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Ōkami (Clover Studio, 2006) · Borderlands (Gearbox, 2009) · Guilty Gear Xrd (Arc System Works, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Arcane (Fortiche, 2021)
- Motion DNA: Real 3D camera moves — orbits, a wide reveal, a hard anime cut to a low skimming run — but everything reads as drawn: shading jumps between bands instead of gliding, and speed lines, spray dots and swirl clouds are graphic shapes.
- Visual DNA: Saturated flat colour in two or three hard tones per surface, cool violet shadows and warm highlights, constant-width ink silhouettes, a banded sea with white foam strokes, and puffy outlined clouds with a curl.
- Signature transitions: Lambert-to-toon wipe, orbit, hard cut, speed-line burst, spring-pop title
- Key techniques: Banded Lambert ramp (3 tones), Inverted-hull outlines, Flat anime palette with tinted shadows, Painter-sorted mesh projection

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Banded Lambert ramp (3 tones), Inverted-hull outlines, Flat anime palette with tinted shadows, Painter-sorted mesh projection).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Banded Lambert ramp (3 tones) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CEL-SHADED 3D", held for about 1 s.

BUILD RULES
- Suggested tools: Toon ramp shaders (Unity / Unreal / Blender), Blender Line Art / Freestyle, Pencil+ (3ds Max / Maya), Canvas 2D (CPU projection, band-split faces, painter's sort). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Cel-shaded 3D motion-graphics film (Toon Shading). Visual style: saturated flat colour in two or three hard tones per surface, cool violet shadows and warm highlights, constant-width ink silhouettes, a banded sea with white foam strokes, and puffy outlined clouds with a curl. Motion: real 3D camera moves — orbits, a wide reveal, a hard anime cut to a low skimming run — but everything reads as drawn: shading jumps between bands instead of gliding, and speed lines, spray dots and swirl clouds are graphic shapes. Signature moves: banded lambert ramp (3 tones), inverted-hull outlines, flat anime palette with tinted shadows, painter-sorted mesh projection; transitions: lambert-to-toon wipe, orbit, hard cut, speed-line burst, spring-pop title. In the tradition of Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Ōkami (Clover Studio, 2006) · Borderlands (Gearbox, 2009) · Guilty Gear Xrd (Arc System Works, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Arcane (Fortiche, 2021). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CEL-SHADED 3D". Punchy sound design synced to every cut.
```
