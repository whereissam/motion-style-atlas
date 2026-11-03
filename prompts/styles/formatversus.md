# Versus

*Split-screen comparison, round by round · 1930s print — · video 2000s — · Narrative Formats*

Reference film: `videos/formatversus.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Versus** (Split-screen comparison, round by round, 1930s print — · video 2000s —; family: Narrative Formats).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Side-by-side product comparison began in print: Consumers Union’s Consumer Reports (from 1936) rated rival products against the same criteria in the same table, and comparative advertising grew on American television after the FTC encouraged it in 1972 — the Pepsi Challenge (1975) turned it into a blind taste test with a score. Car television made the round-by-round head-to-head a format — Top Gear’s challenges, and the drag races and spec sheets of the web reviews that followed — and YouTube tech channels such as MKBHD and Linus Tech Tips settled its modern grammar: split screen, the same tests in the same order, a running score, and a verdict that usually says what it depends on.
- Study these reference works: Consumer Reports ratings tables (Consumers Union, 1936 —) · The Pepsi Challenge (BBDO for Pepsi, 1975) · Marques Brownlee (MKBHD), smartphone versus videos (2010s —)
- Motion DNA: A 1.4 s face-off: both contenders slide in from their edges, the VS badge slams at 0.8 s and the four criteria drop into the table. Four rounds of 1.6 s, each opening on a bell: the criterion pill pops, the same live test plays on both halves at once, and 1.25 s in the row fills, the winner is ticked and its score ticks up with a sound panned to its side. At 2–2 the verdict lands at 7.8 s and holds.
- Visual DNA: A hard vertical split: warm paper with the orange square Token on the left, cool blue-grey paper with a blue disc (the same off-centre hole) on the right. A scoreboard across the top with a black VS roundel; a spec table across the bottom with the criteria in black pills down the centre line, results in heavy Archivo either side, the loser greyed, the winner ticked in its own colour. Gauges, distance bars, red gaps and a width trace in each test.
- Signature transitions: Hard split held throughout; each round cross-fades its tests in place; the verdict replaces the tests while the table stays
- Key techniques: Same criteria in the same order for both sides, One round at a time, tallied on a running score, A verdict that names the condition

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Same criteria in the same order for both sides, One round at a time, tallied on a running score, A verdict that names the condition).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Same criteria in the same order for both sides and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VERSUS", held for about 1 s.

BUILD RULES
- Suggested tools: Two cameras or two renders locked to the same framing, comped side by side, A test script fixed before shooting: criteria, order, scoring rule, Canvas 2D: one test function per round drawn twice with a side flag; score derived from the round table. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Versus motion-graphics film (Split-screen comparison, round by round). Visual style: a hard vertical split: warm paper with the orange square Token on the left, cool blue-grey paper with a blue disc (the same off-centre hole) on the right. A scoreboard across the top with a black VS roundel; a spec table across the bottom with the criteria in black pills down the centre line, results in heavy Archivo either side, the loser greyed, the winner ticked in its own colour. Gauges, distance bars, red gaps and a width trace in each test. Motion: a 1.4 s face-off: both contenders slide in from their edges, the VS badge slams at 0.8 s and the four criteria drop into the table. Four rounds of 1.6 s, each opening on a bell: the criterion pill pops, the same live test plays on both halves at once, and 1.25 s in the row fills, the winner is ticked and its score ticks up with a sound panned to its side. At 2–2 the verdict lands at 7.8 s and holds. Signature moves: same criteria in the same order for both sides, one round at a time, tallied on a running score, a verdict that names the condition; transitions: hard split held throughout; each round cross-fades its tests in place; the verdict replaces the tests while the table stays. In the tradition of Consumer Reports ratings tables (Consumers Union, 1936 —) · The Pepsi Challenge (BBDO for Pepsi, 1975) · Marques Brownlee (MKBHD), smartphone versus videos (2010s —). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VERSUS". Punchy sound design synced to every cut.
```
