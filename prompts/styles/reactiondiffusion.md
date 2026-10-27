# Reaction–Diffusion

*Gray-Scott Patterns · 1952 — · Experimental & Generative*

Reference film: `videos/reactiondiffusion.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Reaction–Diffusion** (Gray-Scott Patterns, 1952 —; family: Experimental & Generative).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Alan Turing's 1952 paper "The Chemical Basis of Morphogenesis" proposed that two diffusing, reacting chemicals could self-organise into spots and stripes; the Gray-Scott model (1983–84) and John Pearson's 1993 "Complex Patterns in a Simple System" map made it a staple of generative art.
- Study these reference works: A. M. Turing, The Chemical Basis of Morphogenesis (1952) · J. E. Pearson, Complex Patterns in a Simple System (Science, 1993) · Karl Sims, Reaction-Diffusion Tutorial & exhibits · Nervous System, Reaction lamps and jewellery · Greg Turk, Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (SIGGRAPH 1991)
- Motion DNA: Nothing is animated directly: two chemicals react and diffuse each step, so fronts grow, branch, split and settle as the feed and kill rates drift through regimes.
- Visual DNA: Organic coral, mitosis spots and labyrinths with crisp iso-contours, rendered as an embossed, specular height field in coral, teal and ivory on near-black.
- Signature transitions: Regime fronts sweeping across the field, pattern dissolve into a mask, mitosis splits, labyrinth infill
- Key techniques: Gray-Scott PDE on a grid, Feed/kill parameter fields, Height-field lighting

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Gray-Scott PDE on a grid, Feed/kill parameter fields, Height-field lighting).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Gray-Scott PDE on a grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "REACTION–DIFFUSION", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, WebGL, TouchDesigner, Houdini. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Reaction–Diffusion motion-graphics film (Gray-Scott Patterns). Visual style: organic coral, mitosis spots and labyrinths with crisp iso-contours, rendered as an embossed, specular height field in coral, teal and ivory on near-black. Motion: nothing is animated directly: two chemicals react and diffuse each step, so fronts grow, branch, split and settle as the feed and kill rates drift through regimes. Signature moves: gray-scott pde on a grid, feed/kill parameter fields, height-field lighting; transitions: regime fronts sweeping across the field, pattern dissolve into a mask, mitosis splits, labyrinth infill. In the tradition of A. M. Turing, The Chemical Basis of Morphogenesis (1952) · J. E. Pearson, Complex Patterns in a Simple System (Science, 1993) · Karl Sims, Reaction-Diffusion Tutorial & exhibits · Nervous System, Reaction lamps and jewellery · Greg Turk, Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (SIGGRAPH 1991). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "REACTION–DIFFUSION". Punchy sound design synced to every cut.
```
