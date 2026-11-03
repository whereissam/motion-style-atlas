# Manifesto

*What the brand believes, one line at a time · 1997 — · Narrative Formats*

Reference film: `videos/formatmanifesto.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Manifesto** (What the brand believes, one line at a time, 1997 —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The brand manifesto film is a statement of belief rather than a product demonstration: a voice reads short declarative lines, each one idea, over images or kinetic type, building to the logo and the brand line. Apple’s “Think Different” (TBWA\Chiat\Day, 1997), read over portraits of “the crazy ones”, set the template; Nike’s long-running “Just Do It” campaign films and many later brand launches use the same shape. In kinetic-type versions the edit is cut to the reading — a word or a phrase to a beat — so the rhythm of the voice becomes the rhythm of the picture.
- Study these reference works: Apple, “Think Different” — Here’s to the Crazy Ones (TBWA\Chiat\Day, 1997) · Nike, “Just Do It” campaign films (Wieden+Kennedy, 1988 —) · Levi’s, “Go Forth” (Wieden+Kennedy, 2009)
- Motion DNA: The voice sets the clock: a word on every beat at 120 BPM, each line one idea. WE BELIEVE rises quietly; IN THINGS THAT MOVE slams in word by word and MOVE. kicks sideways; STILL IS SAFE. is set in outline and held dead still on purpose; MOTION sweeps in at full width; then the build doubles the rate to the half-beat, flashing the ground with each word, and FIRST. zooms through the lens. A cut to black and silence, then the sign-off: the Token draws on and fills on the beat, the wordmark tracks in, the brand line follows the voice.
- Visual DNA: Near-black ground, warm off-white Archivo Black type, the brand orange for the key words, the emblem and the brand line; one line of outline type for the held idea; full-frame orange and paper flashes during the build. A small VO track bottom-right shows the script with each word dotted on the 10 s beat grid.
- Signature transitions: Hard cuts line to line on the beat; slam-ins, a sideways kick, a sweep-on; full-frame colour flashes; a zoom-through into a cut to black
- Key techniques: One idea per line, VO-led rhythm: a word per beat, Build, silence, sign-off

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (One idea per line, VO-led rhythm: a word per beat, Build, silence, sign-off).
- 5.0–8.0 s  Climax: the most spectacular moment, built on One idea per line and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MANIFESTO", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects text animators cut to a VO read, Premiere / Avid edit locked to the voice track, Canvas 2D: a word list timed to beats drives each line’s layout; the emblem strokes on with a line-dash. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural (no recorded voice; the read is implied by the type and the VO track).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Manifesto motion-graphics film (What the brand believes, one line at a time). Visual style: near-black ground, warm off-white Archivo Black type, the brand orange for the key words, the emblem and the brand line; one line of outline type for the held idea; full-frame orange and paper flashes during the build. A small VO track bottom-right shows the script with each word dotted on the 10 s beat grid. Motion: the voice sets the clock: a word on every beat at 120 BPM, each line one idea. WE BELIEVE rises quietly; IN THINGS THAT MOVE slams in word by word and MOVE. kicks sideways; STILL IS SAFE. is set in outline and held dead still on purpose; MOTION sweeps in at full width; then the build doubles the rate to the half-beat, flashing the ground with each word, and FIRST. zooms through the lens. A cut to black and silence, then the sign-off: the Token draws on and fills on the beat, the wordmark tracks in, the brand line follows the voice. Signature moves: one idea per line, vo-led rhythm: a word per beat, build, silence, sign-off; transitions: hard cuts line to line on the beat; slam-ins, a sideways kick, a sweep-on; full-frame colour flashes; a zoom-through into a cut to black. In the tradition of Apple, “Think Different” — Here’s to the Crazy Ones (TBWA\Chiat\Day, 1997) · Nike, “Just Do It” campaign films (Wieden+Kennedy, 1988 —) · Levi’s, “Go Forth” (Wieden+Kennedy, 2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MANIFESTO". Punchy sound design synced to every cut.
```
