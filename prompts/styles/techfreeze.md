# Freeze Frame

*One frame held while time runs on · 1920s — · Technique Atlas*

Reference film: `videos/techfreeze.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Freeze Frame** (One frame held while time runs on, 1920s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A freeze frame is made by printing the same frame again and again: on the optical printer it was step-printing one negative frame for as many output frames as the hold needed, in editing software it is a hold or a still. Silent and early sound films used it for comic and dramatic stops; François Truffaut’s closing freeze on Jean-Pierre Léaud in The 400 Blows (1959) made it a signature ending, and Butch Cassidy and the Sundance Kid (1969) froze its heroes mid-charge, the frame going sepia. Television, sport replays and character-intro title cards added the flash, the push-in and the callout.
- Study these reference works: The 400 Blows / Les Quatre Cents Coups (François Truffaut, 1959; final freeze) · Butch Cassidy and the Sundance Kid (George Roy Hill, 1969; final freeze to sepia) · Lock, Stock and Two Smoking Barrels (Guy Ritchie, 1998; freeze-frame character intros)
- Motion DNA: A lively run of hops, each a quarter-turn flip with squash on landing, on the beat. At 1.5 s it stops dead at the peak of a hop, tilted 45° in the air, for a second and a half while the beat plays on: a flash, the colour drains, the camera eases in, a callout draws itself; then it snaps back into colour and motion. A half-second punch hold on the beat at 5 s, and a final freeze at the peak of the last hop that drains to grey and pushes in slowly to the end.
- Visual DNA: The Technique Atlas stage with its floor line: the orange Token hopping left to right with ghost outlines and dust puffs. A filmstrip of the last ten output frames along the top, each with its source frame number, a HOLD bracket over repeats; a running timecode beside a held frame counter; a checklist of treatments that ticks off during the first hold; a leader-line callout; and the source-time curve as the caption graph.
- Signature transitions: Hard stops into holds with a white flash, a snap release back into colour, and a closing freeze
- Key techniques: Source frame held, output clock running, Flash, desaturate, push-in, callout on the hold, Release back into motion; final freeze to end

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Source frame held, output clock running, Flash, desaturate, push-in, callout on the hold, Release back into motion; final freeze to end).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Source frame held, output clock running and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FREEZE FRAME", held for about 1 s.

BUILD RULES
- Suggested tools: Optical-printer step printing / editorial hold frames, After Effects Freeze Frame or Time Remap hold, Premiere and Resolve frame holds, Canvas 2D: picture drawn from held source time s, overlays from output time t, saturation composite for desaturation. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Freeze Frame motion-graphics film (One frame held while time runs on). Visual style: the Technique Atlas stage with its floor line: the orange Token hopping left to right with ghost outlines and dust puffs. A filmstrip of the last ten output frames along the top, each with its source frame number, a HOLD bracket over repeats; a running timecode beside a held frame counter; a checklist of treatments that ticks off during the first hold; a leader-line callout; and the source-time curve as the caption graph. Motion: a lively run of hops, each a quarter-turn flip with squash on landing, on the beat. At 1.5 s it stops dead at the peak of a hop, tilted 45° in the air, for a second and a half while the beat plays on: a flash, the colour drains, the camera eases in, a callout draws itself; then it snaps back into colour and motion. A half-second punch hold on the beat at 5 s, and a final freeze at the peak of the last hop that drains to grey and pushes in slowly to the end. Signature moves: source frame held, output clock running, flash, desaturate, push-in, callout on the hold, release back into motion; final freeze to end; transitions: hard stops into holds with a white flash, a snap release back into colour, and a closing freeze. In the tradition of The 400 Blows / Les Quatre Cents Coups (François Truffaut, 1959; final freeze) · Butch Cassidy and the Sundance Kid (George Roy Hill, 1969; final freeze to sepia) · Lock, Stock and Two Smoking Barrels (Guy Ritchie, 1998; freeze-frame character intros). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FREEZE FRAME". Punchy sound design synced to every cut.
```
