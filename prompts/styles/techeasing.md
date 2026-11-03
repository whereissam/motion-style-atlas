# Easing

*Slow out, slow in: the same move, four timings · 1930s — · Technique Atlas*

Reference film: `videos/techeasing.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Easing** (Slow out, slow in: the same move, four timings, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: “Slow in and slow out” is one of the twelve principles Disney animators set down and Frank Thomas and Ollie Johnston published in The Illusion of Life (1981): drawings bunch near the keys so a move starts and stops gently, planned on the timing charts animators draw in the margin of each key. Computer animation turned the spacing into curves — Pierre Bézier’s curves (Renault, 1960s) became the handles of every graph editor, Robert Penner’s easing equations (2001) named ease-in, ease-out and ease-in-out in code, and CSS transitions ship the same curves as cubic-bezier() keywords.
- Study these reference works: The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981) · The Animator’s Survival Kit (Richard Williams, 2001; timing and spacing charts) · Robert Penner’s Easing Equations (Flash ActionScript, 2001)
- Motion DNA: Four Tokens leave key A and reach key B at exactly the same moments, so only the spacing differs: the linear one crosses at an even pace, ease-in creeps out and arrives at full speed, ease-out leaves at full speed and creeps in, ease-in-out does both. Three moves, back and forth; between the second and third the handles stretch from quad to cubic so the slow ends get slower and the middle faster; then one large Token steps across a spacing chart, one drawing per sixteenth.
- Visual DNA: The Technique Atlas stage with four lanes between dashed KEY A and KEY B lines; small orange Tokens on thin tracks with rows of frame dots that bunch at the ends; a value/time box per lane with the bezier handles drawn as ink lines and orange knobs and their coordinates; then a classic spacing chart with numbered ticks, a breakdown mark and SLOW OUT / SLOW IN brackets, an even time row fanned onto it, and onion-skin outlines across the track.
- Signature transitions: Lanes run three moves, handles morph quad to cubic, lanes give way to the spacing chart
- Key techniques: Spacing vs timing, Cubic bezier handles, Animator’s spacing chart

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Spacing vs timing, Cubic bezier handles, Animator’s spacing chart).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Spacing vs timing and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "EASING", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects graph editor / Easy Ease (F9) · keyframe velocity, CSS transition-timing-function: ease-in, ease-out, ease-in-out, cubic-bezier(), Canvas 2D: cubic bezier with x solved by bisection, sampled at 8 fps for the spacing dots. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Easing motion-graphics film (Slow out, slow in: the same move, four timings). Visual style: the Technique Atlas stage with four lanes between dashed KEY A and KEY B lines; small orange Tokens on thin tracks with rows of frame dots that bunch at the ends; a value/time box per lane with the bezier handles drawn as ink lines and orange knobs and their coordinates; then a classic spacing chart with numbered ticks, a breakdown mark and SLOW OUT / SLOW IN brackets, an even time row fanned onto it, and onion-skin outlines across the track. Motion: four Tokens leave key A and reach key B at exactly the same moments, so only the spacing differs: the linear one crosses at an even pace, ease-in creeps out and arrives at full speed, ease-out leaves at full speed and creeps in, ease-in-out does both. Three moves, back and forth; between the second and third the handles stretch from quad to cubic so the slow ends get slower and the middle faster; then one large Token steps across a spacing chart, one drawing per sixteenth. Signature moves: spacing vs timing, cubic bezier handles, animator’s spacing chart; transitions: lanes run three moves, handles morph quad to cubic, lanes give way to the spacing chart. In the tradition of The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981) · The Animator’s Survival Kit (Richard Williams, 2001; timing and spacing charts) · Robert Penner’s Easing Equations (Flash ActionScript, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "EASING". Punchy sound design synced to every cut.
```
