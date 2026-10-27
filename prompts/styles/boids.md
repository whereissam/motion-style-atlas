# Boids

*Flocking Simulation · 1987 — · Experimental & Generative*

Reference film: `videos/boids.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Boids** (Flocking Simulation, 1987 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Craig Reynolds' SIGGRAPH 1987 paper "Flocks, Herds, and Schools: A Distributed Behavioral Model" showed that lifelike flocks emerge when every agent steers by three local rules (separation, alignment and cohesion), with no leader and no choreography.
- Study these reference works: Craig Reynolds, Stanley and Stella in "Breaking the Ice" (1987) · Batman Returns, bat swarms and penguin army (1992) · The Lion King, wildebeest stampede (1994) · Robert Hodgin, Flocking studies (2007 —) · Cabbibo / three.js GPGPU birds
- Motion DNA: No bird is animated: thousands of agents each steer from their neighbours at a fixed time step, so density waves ripple, the mass tears open around a predator, mills into a vortex and condenses into form.
- Visual DNA: Ink-black starling silhouettes with flickering wings against a dusk gradient of indigo, rose and amber over still water and reeds, with faint motion trails.
- Signature transitions: Pull-back from a single agent, flash expansion around a predator, vortex mill, condensation into a word, release
- Key techniques: Separation · alignment · cohesion steering, Spatial-hash neighbour search, Fixed-step deterministic cache

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Separation · alignment · cohesion steering, Spatial-hash neighbour search, Fixed-step deterministic cache).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Separation · alignment · cohesion steering and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "BOIDS", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Houdini, Processing, Unity DOTS. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Boids motion-graphics film (Flocking Simulation). Visual style: ink-black starling silhouettes with flickering wings against a dusk gradient of indigo, rose and amber over still water and reeds, with faint motion trails. Motion: no bird is animated: thousands of agents each steer from their neighbours at a fixed time step, so density waves ripple, the mass tears open around a predator, mills into a vortex and condenses into form. Signature moves: separation · alignment · cohesion steering, spatial-hash neighbour search, fixed-step deterministic cache; transitions: pull-back from a single agent, flash expansion around a predator, vortex mill, condensation into a word, release. In the tradition of Craig Reynolds, Stanley and Stella in "Breaking the Ice" (1987) · Batman Returns, bat swarms and penguin army (1992) · The Lion King, wildebeest stampede (1994) · Robert Hodgin, Flocking studies (2007 —) · Cabbibo / three.js GPGPU birds. Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "BOIDS". Punchy sound design synced to every cut.
```
