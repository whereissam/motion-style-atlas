# Fluid

*Particles that push their neighbours apart · 1977 — · Technique Atlas*

Reference film: `videos/techfluid.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Fluid** (Particles that push their neighbours apart, 1977 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Smoothed-particle hydrodynamics was devised in 1977 by Robert Gingold and Joe Monaghan, and independently by Leon Lucy, to simulate stars. Matthias Müller, David Charypar and Markus Gross brought it to interactive graphics in Particle-Based Fluid Simulation for Interactive Applications (2003), and Simon Clavet, Philippe Beaudoin and Pierre Poulin’s double-density relaxation (2005) made splashy, stable particle liquids cheap; grid solvers in the line of Jos Stam’s Stable Fluids (1999) and FLIP hybrids carry the film work.
- Study these reference works: Antz (DreamWorks / PDI, 1998; water simulation) · Ratatouille (Pixar, 2007) · Moana (Walt Disney Animation Studios, 2016)
- Motion DNA: Still water first, shown as bare particles; the Token drops on the beat and the surface tears into a crown splash that rains back, the body sinks, slows, rises on its own buoyancy and bobs to a float. A spring then drags it through the water and back, piling a bow wave against the glass, and the sloshing decays to a level surface.
- Visual DNA: The Technique Atlas stage with a glass tank on the floor; the liquid drawn as blue metaballs over the half-submerged orange Token, droplets as dots; mono labels for the method, parameters and phase; a neighbourhood diagram with the smoothing radius h; velocity arrows in the action; a debug inset with every particle coloured by speed.
- Signature transitions: Particles → liquid surface; still, splash, float, push, settle; the energy curve rises and decays
- Key techniques: SPH density from neighbours within h, Double-density relaxation (pressure + near-pressure), Two-way rigid-body coupling

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (SPH density from neighbours within h, Double-density relaxation (pressure + near-pressure), Two-way rigid-body coupling).
- 5.0–8.0 s  Climax: the most spectacular moment, built on SPH density from neighbours within h and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FLUID", held for about 1 s.

BUILD RULES
- Suggested tools: SPH with double-density relaxation precomputed in setup (4 substeps), Uniform-grid neighbour search, XSPH-style viscosity, Canvas 2D: half-res metaball threshold of additive particle sprites. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Fluid motion-graphics film (Particles that push their neighbours apart). Visual style: the Technique Atlas stage with a glass tank on the floor; the liquid drawn as blue metaballs over the half-submerged orange Token, droplets as dots; mono labels for the method, parameters and phase; a neighbourhood diagram with the smoothing radius h; velocity arrows in the action; a debug inset with every particle coloured by speed. Motion: still water first, shown as bare particles; the Token drops on the beat and the surface tears into a crown splash that rains back, the body sinks, slows, rises on its own buoyancy and bobs to a float. A spring then drags it through the water and back, piling a bow wave against the glass, and the sloshing decays to a level surface. Signature moves: sph density from neighbours within h, double-density relaxation (pressure + near-pressure), two-way rigid-body coupling; transitions: particles → liquid surface; still, splash, float, push, settle; the energy curve rises and decays. In the tradition of Antz (DreamWorks / PDI, 1998; water simulation) · Ratatouille (Pixar, 2007) · Moana (Walt Disney Animation Studios, 2016). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FLUID". Punchy sound design synced to every cut.
```
