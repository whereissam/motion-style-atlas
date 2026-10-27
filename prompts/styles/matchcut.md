# Match-cut Montage

*The Shape Holds, the World Changes · 1968 — · Cinematic & Film Language*

Reference film: `videos/matchcut.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Match-cut Montage** (The Shape Holds, the World Changes, 1968 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A graphic match cut joins two shots through a shared shape, position or movement so the eye glides across the edit. Kubrick's bone-to-satellite cut in 2001: A Space Odyssey (1968) and David Lean's match from a blown-out match flame to a desert sunrise in Lawrence of Arabia (1962) made it famous; Edgar Wright and countless title sequences turned it into rapid rhythmic montage.
- Study these reference works: Lawrence of Arabia (David Lean, 1962) · 2001: A Space Odyssey (Stanley Kubrick, 1968) · Psycho (Alfred Hitchcock, 1960; drain to eye) · Requiem for a Dream (Darren Aronofsky, 2000) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007)
- Motion DNA: Hard cuts on the beat while one shape stays nailed to the frame: rotation carries through iris, planet, coffee swirl, record and wheel; a station clock snaps to noon and pushes in until its hands become a pen, a tower and a rising rocket.
- Visual DNA: Every shot a different world and palette (macro skin and iris, deep space, a mint terrazzo café table, walnut hi-fi, a magenta street, a Lean-red desert, a station clock) unified by one locked circle and one locked line inside a 2.39 letterbox.
- Signature transitions: Graphic match cuts, motion match cuts, a stutter flurry of quarter-beat cuts, a push-in that converts circle to line, trail-to-lockup.
- Key techniques: Every shot drawn round one shared circle (R) or vertical bar (L), Slow push held across cuts so the shape never jumps, Clock-hand zoom that converts the circle chain into the line chain, Hairline match guide and flash on each cut, Letterbox edit readout: shot, timecode, cut ticks

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Every shot drawn round one shared circle (R) or vertical bar (L), Slow push held across cuts so the shape never jumps, Clock-hand zoom that converts the circle chain into the line chain, Hairline match guide and flash on each cut, Letterbox edit readout: shot, timecode, cut ticks).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Every shot drawn round one shared circle (R) or vertical bar (L) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MATCH-CUT MONTAGE", held for about 1 s.

BUILD RULES
- Suggested tools: Live action + editorial, After Effects / Premiere, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Match-cut Montage motion-graphics film (The Shape Holds, the World Changes). Visual style: every shot a different world and palette (macro skin and iris, deep space, a mint terrazzo café table, walnut hi-fi, a magenta street, a Lean-red desert, a station clock) unified by one locked circle and one locked line inside a 2.39 letterbox. Motion: hard cuts on the beat while one shape stays nailed to the frame: rotation carries through iris, planet, coffee swirl, record and wheel; a station clock snaps to noon and pushes in until its hands become a pen, a tower and a rising rocket. Signature moves: every shot drawn round one shared circle (r) or vertical bar (l), slow push held across cuts so the shape never jumps, clock-hand zoom that converts the circle chain into the line chain, hairline match guide and flash on each cut, letterbox edit readout: shot, timecode, cut ticks; transitions: graphic match cuts, motion match cuts, a stutter flurry of quarter-beat cuts, a push-in that converts circle to line, trail-to-lockup. In the tradition of Lawrence of Arabia (David Lean, 1962) · 2001: A Space Odyssey (Stanley Kubrick, 1968) · Psycho (Alfred Hitchcock, 1960; drain to eye) · Requiem for a Dream (Darren Aronofsky, 2000) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MATCH-CUT MONTAGE". Punchy sound design synced to every cut.
```
