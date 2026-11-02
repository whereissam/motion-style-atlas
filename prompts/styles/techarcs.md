# Arcs

*Natural motion travels on curves, not straight lines · 1930s — · Technique Atlas*

Reference film: `videos/techarcs.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Arcs** (Natural motion travels on curves, not straight lines, 1930s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Arcs are one of the twelve principles of animation that Disney animators Ollie Johnston and Frank Thomas set down in The Illusion of Life (1981), codifying practice from the Disney studio of the 1930s: limbs pivot at joints, so almost every natural movement traces a curve, and in-betweens drawn on a straight line look mechanical. The animator fixes the curve with a breakdown drawing between the keys; Richard Williams’ Animator’s Survival Kit (2001) drills the same habit of plotting the arc and spacing every in-between along it.
- Study these reference works: Snow White and the Seven Dwarfs (Disney, 1937) · The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston, 1981) · The Animator’s Survival Kit (Richard Williams, 2001)
- Motion DNA: Two keys and one eased timing, played twice: an ink Token slides the straight chord, then the orange Token, with the same spacing and rotation, rises through a breakdown and lands on the same key along a curve. After a crossfade the Token hangs from a pivot and swings, slow at the extremes and fast through the bottom, its amplitude decaying on every beat-aligned pass.
- Visual DNA: The Technique Atlas stage with dashed key ghosts, a dashed chord and ink spacing dots against an orange arc and dark-orange dots; a breakdown ghost with an accent arrow from the straight middle drawing; then a pivot, an ink rod, a dashed arc guide, a dotted chord, a row of spacing dots and fading onion skins.
- Signature transitions: Straight pass, breakdown, arc pass, then a crossfade to the swing
- Key techniques: Breakdown pose off the straight line, Arc-plotted in-betweens, Pivot + fixed radius swing

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Breakdown pose off the straight line, Arc-plotted in-betweens, Pivot + fixed radius swing).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Breakdown pose off the straight line and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ARCS", held for about 1 s.

BUILD RULES
- Suggested tools: Hand-drawn keys, breakdowns and in-betweens plotted on arc charts, After Effects motion-path bezier or a parented null as pivot, Canvas 2D: quadratic through key, breakdown and key; closed-form damped pendulum with onion skins. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Arcs motion-graphics film (Natural motion travels on curves, not straight lines). Visual style: the Technique Atlas stage with dashed key ghosts, a dashed chord and ink spacing dots against an orange arc and dark-orange dots; a breakdown ghost with an accent arrow from the straight middle drawing; then a pivot, an ink rod, a dashed arc guide, a dotted chord, a row of spacing dots and fading onion skins. Motion: two keys and one eased timing, played twice: an ink Token slides the straight chord, then the orange Token, with the same spacing and rotation, rises through a breakdown and lands on the same key along a curve. After a crossfade the Token hangs from a pivot and swings, slow at the extremes and fast through the bottom, its amplitude decaying on every beat-aligned pass. Signature moves: breakdown pose off the straight line, arc-plotted in-betweens, pivot + fixed radius swing; transitions: straight pass, breakdown, arc pass, then a crossfade to the swing. In the tradition of Snow White and the Seven Dwarfs (Disney, 1937) · The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston, 1981) · The Animator’s Survival Kit (Richard Williams, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ARCS". Punchy sound design synced to every cut.
```
