# Follow-through

*The body stops, the loose parts keep going · 1930s — · Technique Atlas*

Reference film: `videos/techfollowthrough.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Follow-through** (The body stops, the loose parts keep going, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Disney’s animators described how the loose parts of a character — ears, tail, clothing, hair — trail behind the main mass, keep moving after it stops and settle one after another. Frank Thomas and Ollie Johnston named the pair Follow Through and Overlapping Action, the fifth of the twelve principles in The Illusion of Life (1981); John Lasseter restated it for computer animation at SIGGRAPH in 1987, and Richard Williams drilled it as drag and overlap with tails and flags in The Animator’s Survival Kit (2001). Riggers now get it from delayed or spring-driven secondary chains.
- Study these reference works: The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981) · Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter, SIGGRAPH 1987) · The Animator’s Survival Kit (Richard Williams, 2001; drag, overlap and the flag)
- Motion DNA: The body moves on plain ease-in-out slides and stops dead; everything else is secondary. On the start the antenna bends back from the base up, segment by segment; on the stop it whips forward, the tip last and farthest, swings back and settles over a couple of seconds, each segment peaking a few frames after the one below it. Three moves: a long slide, a quicker return, a short jolt.
- Visual DNA: The Technique Atlas stage with its floor; the orange Token with a four-segment ink antenna, ring joints and an orange ball tip; faint onion skins of the last frames of the antenna; a dashed rigid antenna for comparison; BODY STOPS and TAIL KEEPS GOING callouts; a framed chart of the four segment angles over the whole film with stop markers and each segment’s lag in frames.
- Signature transitions: Three moves on one stage; the rigid ghost and chart annotations fade in as the comparison starts
- Key techniques: Chain of lagging damped springs, Drag: each segment a few frames behind, Overshoot and settle after the stop

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Chain of lagging damped springs, Drag: each segment a few frames behind, Overshoot and settle after the stop).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Chain of lagging damped springs and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FOLLOW-THROUGH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects Duik / Limber dynamics, or delayed valueAtTime() expressions down a parented chain, Spring bones / jiggle chains in Maya, Blender and game engines, Canvas 2D: a chain of damped angular springs integrated in setup() at 1200 Hz, sampled and lerped per frame. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Follow-through motion-graphics film (The body stops, the loose parts keep going). Visual style: the Technique Atlas stage with its floor; the orange Token with a four-segment ink antenna, ring joints and an orange ball tip; faint onion skins of the last frames of the antenna; a dashed rigid antenna for comparison; BODY STOPS and TAIL KEEPS GOING callouts; a framed chart of the four segment angles over the whole film with stop markers and each segment’s lag in frames. Motion: the body moves on plain ease-in-out slides and stops dead; everything else is secondary. On the start the antenna bends back from the base up, segment by segment; on the stop it whips forward, the tip last and farthest, swings back and settles over a couple of seconds, each segment peaking a few frames after the one below it. Three moves: a long slide, a quicker return, a short jolt. Signature moves: chain of lagging damped springs, drag: each segment a few frames behind, overshoot and settle after the stop; transitions: three moves on one stage; the rigid ghost and chart annotations fade in as the comparison starts. In the tradition of The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981) · Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter, SIGGRAPH 1987) · The Animator’s Survival Kit (Richard Williams, 2001; drag, overlap and the flag). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FOLLOW-THROUGH". Punchy sound design synced to every cut.
```
