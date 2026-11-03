# Text Reveal

*Four ways to bring a line on screen · 1950s — · Technique Atlas*

Reference film: `videos/techtextreveal.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Text Reveal** (Four ways to bring a line on screen, 1950s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Title designers of the 1950s and 60s, Saul Bass first among them, made the way words arrive part of the film, revealing type with travelling mattes, sliding bars and wipes on the animation stand and optical printer. The typewriter reveal borrows from teleprinters and computer terminals; blur- and tracking-in became trailer staples once desktop compositors such as After Effects (1993) brought per-character text animation; and the scramble or decode reveal — random characters cycling until each locks — became screen shorthand for computers cracking a code.
- Study these reference works: Psycho (Alfred Hitchcock, 1960; titles by Saul Bass, type sliced and slid by bars) · All the President’s Men (Alan J. Pakula, 1976; typewriter keys strike the opening) · WarGames (John Badham, 1983; launch-code characters cycle and lock one by one)
- Motion DNA: Four reveals in sequence, about two seconds each, and every revealed panel holds. The slide-up rises on a hard ease-out, the second line a beat-fraction behind; the typewriter steps at twelve glyphs a second and the cursor blinks on the half-beat once it stops; the blur-in closes tracking, blur and opacity together on one ease-out; the scramble flickers at twenty steps a second and locks left to right with a little seeded jitter.
- Visual DNA: The Technique Atlas stage split into four panels with numbered mono headers and progress bars, MOTION in Archivo 900 over a second line in Archivo 800, the Token beside each; dashed orange mask rectangles with the clipped-off part ghosted, a stepping clip edge and block cursor, live blur and tracking readouts, and orange unlocked glyphs turning ink as they lock.
- Signature transitions: Masked slide, stepped typewriter, blur-and-track focus-in, decode scramble
- Key techniques: Clip-rect line masks, Stepped glyph count + cursor, Seeded scramble with staggered lock

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Clip-rect line masks, Stepped glyph count + cursor, Seeded scramble with staggered lock).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Clip-rect line masks and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TEXT REVEAL", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects text animators: Range Selector with Position, Blur, Tracking and Character Offset, CSS/JS: overflow-hidden line wrappers, steps() timing, seeded scramble scripts, Canvas 2D: clip rects, ctx.filter blur, per-slot hashed glyphs keyed to a step count. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (scramble seeded).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Text Reveal motion-graphics film (Four ways to bring a line on screen). Visual style: the Technique Atlas stage split into four panels with numbered mono headers and progress bars, MOTION in Archivo 900 over a second line in Archivo 800, the Token beside each; dashed orange mask rectangles with the clipped-off part ghosted, a stepping clip edge and block cursor, live blur and tracking readouts, and orange unlocked glyphs turning ink as they lock. Motion: four reveals in sequence, about two seconds each, and every revealed panel holds. The slide-up rises on a hard ease-out, the second line a beat-fraction behind; the typewriter steps at twelve glyphs a second and the cursor blinks on the half-beat once it stops; the blur-in closes tracking, blur and opacity together on one ease-out; the scramble flickers at twenty steps a second and locks left to right with a little seeded jitter. Signature moves: clip-rect line masks, stepped glyph count + cursor, seeded scramble with staggered lock; transitions: masked slide, stepped typewriter, blur-and-track focus-in, decode scramble. In the tradition of Psycho (Alfred Hitchcock, 1960; titles by Saul Bass, type sliced and slid by bars) · All the President’s Men (Alan J. Pakula, 1976; typewriter keys strike the opening) · WarGames (John Badham, 1983; launch-code characters cycle and lock one by one). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TEXT REVEAL". Punchy sound design synced to every cut.
```
