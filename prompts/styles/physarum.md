# Physarum

*Slime-mould transport networks · 2010 — · Experimental & Generative*

Reference film: `videos/physarum.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Physarum** (Slime-mould transport networks, 2010 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: In 2010 Atsushi Tero and colleagues placed oat flakes on agar at the positions of the cities around Tokyo, inoculated Physarum polycephalum at Tokyo, and watched the mould grow a network of tubes as efficient and fault-tolerant as the real rail system. The same year Jeff Jones published a minimal agent model of it: thousands of particles that sense a chemical trail ahead of them, turn toward it, step and deposit, while the trail map diffuses and decays. Generative artists such as Sage Jenson took that model up as a drawing machine, and its veined, self-pruning networks became a recognisable generative look.
- Study these reference works: Toshiyuki Nakagaki, Hiroyasu Yamada & Ágota Tóth — "Maze-solving by an amoeboid organism", Nature 2000 · Jeff Jones — "Characteristics of Pattern Formation and Evolution in Approximations of Physarum Transport Networks", Artificial Life 2010 · Atsushi Tero et al. — "Rules for Biologically Inspired Adaptive Network Design", Science 2010 · Sage Jenson — 36 Points (2019)
- Motion DNA: Growth, not animation: a dense fan-shaped front spreads from the inoculum, finds the food, then the foam of paths coarsens and starves until only a few thick tubes remain, pulsing with slow waves of shuttle streaming.
- Visual DNA: Chrome-yellow plasmodium glowing on dark agar, soft diffused veins with brighter cores, pale oat flakes as nodes, a schematic coastline, lab-notebook mono labels and a thin cyan comparison graph.
- Signature transitions: Flakes laid, inoculation, foraging front, network pruning, streaming pulse, comparison overlay and title
- Key techniques: Sense–turn–deposit agents, Diffuse & decay trail map, Precomputed keyframes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Sense–turn–deposit agents, Diffuse & decay trail map, Precomputed keyframes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Sense–turn–deposit agents and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PHYSARUM", held for about 1 s.

BUILD RULES
- Suggested tools: Compute shaders (GLSL / WebGPU), Processing / openFrameworks, TouchDesigner, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Physarum motion-graphics film (Slime-mould transport networks). Visual style: chrome-yellow plasmodium glowing on dark agar, soft diffused veins with brighter cores, pale oat flakes as nodes, a schematic coastline, lab-notebook mono labels and a thin cyan comparison graph. Motion: growth, not animation: a dense fan-shaped front spreads from the inoculum, finds the food, then the foam of paths coarsens and starves until only a few thick tubes remain, pulsing with slow waves of shuttle streaming. Signature moves: sense–turn–deposit agents, diffuse & decay trail map, precomputed keyframes; transitions: flakes laid, inoculation, foraging front, network pruning, streaming pulse, comparison overlay and title. In the tradition of Toshiyuki Nakagaki, Hiroyasu Yamada & Ágota Tóth — "Maze-solving by an amoeboid organism", Nature 2000 · Jeff Jones — "Characteristics of Pattern Formation and Evolution in Approximations of Physarum Transport Networks", Artificial Life 2010 · Atsushi Tero et al. — "Rules for Biologically Inspired Adaptive Network Design", Science 2010 · Sage Jenson — 36 Points (2019). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PHYSARUM". Punchy sound design synced to every cut.
```
