# Calligraphic Motion

*Thick & Thin, Stroke by Stroke · 1906 — · Typography & Text Motion*

Reference film: `videos/calligraphic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Calligraphic Motion** (Thick & Thin, Stroke by Stroke, 1906 —; family: Typography & Text Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Edward Johnston’s Writing & Illuminating, & Lettering (1906) revived the broad-edged pen and taught that every letter is a sequence of strokes made at a constant pen angle; Hermann Zapf carried that hand into type and lettering (Palatino 1948, Zapfino 1998). Title designers and lettering artists made the write-on its film form, revealing a word in the order a scribe would draw it, with the nib’s thick-and-thin contrast intact.
- Study these reference works: Edward Johnston, Writing & Illuminating, & Lettering (1906) · Hermann Zapf, Pen and Graver (1952) · Saul Bass, The Age of Innocence title sequence (1993) · Seb Lester’s filmed calligraphy (2010s —) · Apple’s script “hello” (Macintosh, 1984 —)
- Motion DNA: Every letter is revealed in true stroke order and direction, a pen leading the mark; strokes accelerate through the straights and slow into the turns, the pen lifts and arcs between strokes, and a final flourish swings out faster than the letters.
- Visual DNA: Black-brown ink on cream laid paper with thick downstrokes and hairline upstrokes fixed by a 40° pen angle, a vermilion versal capital, pencil guide lines and a nib-width ladder in the margin, and glossy pooled ink at every stroke ending.
- Signature transitions: Macro on the nib, pull-back write-on, flourish under-swing, erase of the guide lines, title settle
- Key techniques: Broad-edge nib swept at a fixed angle, Stroke-order write-on, Pointed-pen pressure swells, Wet iron-gall ink pooling and drying

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Broad-edge nib swept at a fixed angle, Stroke-order write-on, Pointed-pen pressure swells, Wet iron-gall ink pooling and drying).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Broad-edge nib swept at a fixed angle and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CALLIGRAPHIC MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects (stroke write-on over hand-traced paths), Canvas 2D, Web Audio. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Calligraphic Motion motion-graphics film (Thick & Thin, Stroke by Stroke). Visual style: black-brown ink on cream laid paper with thick downstrokes and hairline upstrokes fixed by a 40° pen angle, a vermilion versal capital, pencil guide lines and a nib-width ladder in the margin, and glossy pooled ink at every stroke ending. Motion: every letter is revealed in true stroke order and direction, a pen leading the mark; strokes accelerate through the straights and slow into the turns, the pen lifts and arcs between strokes, and a final flourish swings out faster than the letters. Signature moves: broad-edge nib swept at a fixed angle, stroke-order write-on, pointed-pen pressure swells, wet iron-gall ink pooling and drying; transitions: macro on the nib, pull-back write-on, flourish under-swing, erase of the guide lines, title settle. In the tradition of Edward Johnston, Writing & Illuminating, & Lettering (1906) · Hermann Zapf, Pen and Graver (1952) · Saul Bass, The Age of Innocence title sequence (1993) · Seb Lester’s filmed calligraphy (2010s —) · Apple’s script “hello” (Macintosh, 1984 —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CALLIGRAPHIC MOTION". Punchy sound design synced to every cut.
```
