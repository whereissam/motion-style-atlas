# Direct-on-Film

*Scratched & Painted Celluloid · 1930s — · Analog, Physical & Stop Motion*

Reference film: `videos/directfilm.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Direct-on-Film** (Scratched & Painted Celluloid, 1930s —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Cameraless animation: artists paint, dye, scratch and stick things straight onto film stock, frame by frame or along the strip, and project the result. Len Lye and Norman McLaren turned it into visual music.
- Study these reference works: A Colour Box (Len Lye, 1935) · Free Radicals (Len Lye, 1958) · Begone Dull Care (Norman McLaren & Evelyn Lambart, 1949) · Blinkity Blank (Norman McLaren, 1955) · Mothlight (Stan Brakhage, 1963)
- Motion DNA: Visual music: every bass step, cymbal and snare lands on the frame as a new blob, a leaping scratch or a starburst, boiling at 24 fps.
- Visual DNA: Translucent dye and white needle lines on celluloid, with sprocket holes, dust, hair, gate weave and flicker showing the medium.
- Signature transitions: Frame slip, colour/black flicker, burn-out, white flash
- Key techniques: Dye painted along the strip, Needle scratches on black leader, Projector weave & flicker

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Dye painted along the strip, Needle scratches on black leader, Projector weave & flicker).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Dye painted along the strip and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DIRECT-ON-FILM", held for about 1 s.

BUILD RULES
- Suggested tools: Film stock + paint + needle, Optical printer, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Direct-on-Film motion-graphics film (Scratched & Painted Celluloid). Visual style: translucent dye and white needle lines on celluloid, with sprocket holes, dust, hair, gate weave and flicker showing the medium. Motion: visual music: every bass step, cymbal and snare lands on the frame as a new blob, a leaping scratch or a starburst, boiling at 24 fps. Signature moves: dye painted along the strip, needle scratches on black leader, projector weave & flicker; transitions: frame slip, colour/black flicker, burn-out, white flash. In the tradition of A Colour Box (Len Lye, 1935) · Free Radicals (Len Lye, 1958) · Begone Dull Care (Norman McLaren & Evelyn Lambart, 1949) · Blinkity Blank (Norman McLaren, 1955) · Mothlight (Stan Brakhage, 1963). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DIRECT-ON-FILM". Punchy sound design synced to every cut.
```
