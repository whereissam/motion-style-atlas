# Lo-fi Loop

*Beats to Study To · 2017 — · 2D Animation & Illustration*

Reference film: `videos/lofi.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Lo-fi Loop** (Beats to Study To, 2017 —; family: 2D Animation & Illustration).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The “lofi hip hop radio – beats to relax/study to” livestreams turned a few seconds of anime-style animation into a round-the-clock seamless loop: a student writing by a window at night while dusty, swung hip-hop plays. ChilledCow (later Lofi Girl) first looped Shizuku from Studio Ghibli’s Whisper of the Heart (1995), then commissioned an original studying girl drawn by Juan Pablo Machado; the sound descends from J Dilla’s Donuts and Nujabes’s work on Samurai Champloo.
- Study these reference works: lofi hip hop radio – beats to relax/study to (ChilledCow / Lofi Girl, YouTube, 2017–) · Samurai Champloo soundtrack (Nujabes, Fat Jon, Force of Nature, Tsutchie, 2004) · Donuts (J Dilla, 2006) · Whisper of the Heart (Yoshifumi Kondō, Studio Ghibli, 1995)
- Motion DNA: Almost nothing moves and everything breathes: a nod on every beat, a pencil hand scribbling, steam curling off the mug, rain sliding down the glass, a sleeping cat flicking its tail, city windows blinking — each a whole number of cycles in the loop, so the last frame runs straight into the first.
- Visual DNA: An indigo night room split between a warm desk lamp and a cold rainy window, flat anime cel colour with soft gradients, warm and blue rim lights on hair, hoodie and fur, fairy lights and blurred city bokeh, all under a soft VHS grade with purple-lifted blacks, scanlines and grain.
- Signature transitions: None: one endless shot; the last frame cuts back to the first
- Key techniques: Seamless loop, whole-number cycles, Lamp & window rim lights on cels, VHS-soft blur, lifted blacks, grain

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Seamless loop, whole-number cycles, Lamp & window rim lights on cels, VHS-soft blur, lifted blacks, grain).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Seamless loop, whole-number cycles and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LO-FI LOOP", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-drawn loop (Photoshop, Clip Studio, TVPaint), After Effects loopOut() expressions, 24/7 YouTube livestream, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural (an original character; scene, loop and grade generated in code).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Lo-fi Loop motion-graphics film (Beats to Study To). Visual style: an indigo night room split between a warm desk lamp and a cold rainy window, flat anime cel colour with soft gradients, warm and blue rim lights on hair, hoodie and fur, fairy lights and blurred city bokeh, all under a soft VHS grade with purple-lifted blacks, scanlines and grain. Motion: almost nothing moves and everything breathes: a nod on every beat, a pencil hand scribbling, steam curling off the mug, rain sliding down the glass, a sleeping cat flicking its tail, city windows blinking — each a whole number of cycles in the loop, so the last frame runs straight into the first. Signature moves: seamless loop, whole-number cycles, lamp & window rim lights on cels, vhs-soft blur, lifted blacks, grain; transitions: none: one endless shot; the last frame cuts back to the first. In the tradition of lofi hip hop radio – beats to relax/study to (ChilledCow / Lofi Girl, YouTube, 2017–) · Samurai Champloo soundtrack (Nujabes, Fat Jon, Force of Nature, Tsutchie, 2004) · Donuts (J Dilla, 2006) · Whisper of the Heart (Yoshifumi Kondō, Studio Ghibli, 1995). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LO-FI LOOP". Punchy sound design synced to every cut.
```
