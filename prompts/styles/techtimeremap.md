# Time Remapping

*One clip, a new clock · 1890s — · Technique Atlas*

Reference film: `videos/techtimeremap.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Time Remapping** (One clip, a new clock, 1890s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Changing the speed of time on screen is as old as the hand-cranked camera: overcranking gave slow motion, undercranking fast motion, and early filmmakers ran film backwards for reverse. Optical printers could hold frames for a freeze or skip them, and the closing freeze of Truffaut’s The 400 Blows (1959) made the held frame famous. Digital editing turned it into a curve: Adobe After Effects’ Time Remapping maps output time to source time per frame, and speed ramps became a staple of music videos and action films after The Matrix (1999).
- Study these reference works: The 400 Blows / Les Quatre Cents Coups (François Truffaut, 1959; final freeze frame) · The Matrix (The Wachowskis, 1999) · 300 (Zack Snyder, 2007; speed ramps)
- Motion DNA: The source clip is an even, regular hop; all the expression comes from the clock. Two seconds at 100%, a one-second ease into 20%, a hard hold at 4.5 s, a cut into −100% reverse at 5.5 s, a ramp through zero up to 250% and a final ease back to 100% — so the same hop reads as floaty, frozen, rewound and frantic.
- Visual DNA: The Technique Atlas stage with its floor line: the orange Token hopping across a dotted path, six outlined ghosts at fixed output intervals, an ink arrow showing source velocity; a source ruler under the floor with a playhead and source-frame counter; a speed graph and a large speed percentage top right; the remap curve (source time over output time) as the caption graph.
- Signature transitions: Speed ramps, a hold (freeze frame), a hard cut into reverse
- Key techniques: Keyed speed integrated to a remap curve, Freeze as a hold, Reverse as negative speed

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Keyed speed integrated to a remap curve, Freeze as a hold, Reverse as negative speed).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Keyed speed integrated to a remap curve and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "TIME REMAPPING", held for about 1 s.

BUILD RULES
- Suggested tools: Over- and undercranked cameras, optical-printer step printing, After Effects Time Remapping / Premiere and Resolve speed ramps, Canvas 2D: keyed speed integrated in setup() into a source-time table. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Time Remapping motion-graphics film (One clip, a new clock). Visual style: the Technique Atlas stage with its floor line: the orange Token hopping across a dotted path, six outlined ghosts at fixed output intervals, an ink arrow showing source velocity; a source ruler under the floor with a playhead and source-frame counter; a speed graph and a large speed percentage top right; the remap curve (source time over output time) as the caption graph. Motion: the source clip is an even, regular hop; all the expression comes from the clock. Two seconds at 100%, a one-second ease into 20%, a hard hold at 4.5 s, a cut into −100% reverse at 5.5 s, a ramp through zero up to 250% and a final ease back to 100% — so the same hop reads as floaty, frozen, rewound and frantic. Signature moves: keyed speed integrated to a remap curve, freeze as a hold, reverse as negative speed; transitions: speed ramps, a hold (freeze frame), a hard cut into reverse. In the tradition of The 400 Blows / Les Quatre Cents Coups (François Truffaut, 1959; final freeze frame) · The Matrix (The Wachowskis, 1999) · 300 (Zack Snyder, 2007; speed ramps). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "TIME REMAPPING". Punchy sound design synced to every cut.
```
