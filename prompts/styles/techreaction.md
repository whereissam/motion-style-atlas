# Reaction-Diffusion

*Two chemicals, feed and kill: Gray–Scott patterns · 1952 — · Technique Atlas*

Reference film: `videos/techreaction.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Reaction-Diffusion** (Two chemicals, feed and kill: Gray–Scott patterns, 1952 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Alan Turing’s The Chemical Basis of Morphogenesis (1952) showed that two diffusing, reacting chemicals can break a uniform field into spots and stripes. Peter Gray and Stephen K. Scott’s autocatalytic reaction model (1983–84) became the favourite system for it after John E. Pearson’s Complex Patterns in a Simple System (Science, 1993) mapped its feed and kill parameters into a zoo of regimes. Greg Turk and, separately, Andrew Witkin and Michael Kass brought reaction-diffusion textures to computer graphics at SIGGRAPH 1991; GPU shaders later made it a live, seedable motion-graphics effect.
- Study these reference works: Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (Greg Turk, SIGGRAPH 1991) · Reaction-Diffusion Textures (Andrew Witkin & Michael Kass, SIGGRAPH 1991) · Complex Patterns in a Simple System (John E. Pearson, Science, 1993)
- Motion DNA: Nothing is animated by hand: a dashed outline of the Token is poured into three dishes on the first downbeat and the equations take over. Slowly at first, then faster as more steps run per frame, the outline swells and breaks — into dots that split and pack the dish, into parallel bands that echo the Token’s corners outward, into a branching coral maze. One dish is spotlit every two bars while its point lights up on the F–k map.
- Visual DNA: The Technique Atlas stage; three square dishes of paper-white U and orange V, framed in thin ink; the two equations and a 3 × 3 Laplacian stencil in mono type; a small F–k chart with the saddle-node curve, the three parameter dots and region labels; step counter and mono labels with F and k under each dish.
- Signature transitions: Continuous growth from one seed; a spotlight moves dish to dish on the bar
- Key techniques: Gray–Scott: u·v² reaction, feed F, kill k, Diffusion by a 3 × 3 Laplacian, V at half the rate of U, Same seed, three (F, k) pairs, three regimes

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Gray–Scott: u·v² reaction, feed F, kill k, Diffusion by a 3 × 3 Laplacian, V at half the rate of U, Same seed, three (F, k) pairs, three regimes).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Gray–Scott: u·v² reaction, feed F, kill k and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "REACTION-DIFFUSION", held for about 1 s.

BUILD RULES
- Suggested tools: Gray–Scott on three 160 × 160 grids precomputed in setup (5,200 steps, Δt 1, wrap-around), Byte frames stored at 15 fps and blended per pixel through a paper → orange colour ramp, Canvas 2D: per-dish ImageData on small offscreens, scaled up with smoothing. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Reaction-Diffusion motion-graphics film (Two chemicals, feed and kill: Gray–Scott patterns). Visual style: the Technique Atlas stage; three square dishes of paper-white U and orange V, framed in thin ink; the two equations and a 3 × 3 Laplacian stencil in mono type; a small F–k chart with the saddle-node curve, the three parameter dots and region labels; step counter and mono labels with F and k under each dish. Motion: nothing is animated by hand: a dashed outline of the Token is poured into three dishes on the first downbeat and the equations take over. Slowly at first, then faster as more steps run per frame, the outline swells and breaks — into dots that split and pack the dish, into parallel bands that echo the Token’s corners outward, into a branching coral maze. One dish is spotlit every two bars while its point lights up on the F–k map. Signature moves: gray–scott: u·v² reaction, feed f, kill k, diffusion by a 3 × 3 laplacian, v at half the rate of u, same seed, three (f, k) pairs, three regimes; transitions: continuous growth from one seed; a spotlight moves dish to dish on the bar. In the tradition of Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (Greg Turk, SIGGRAPH 1991) · Reaction-Diffusion Textures (Andrew Witkin & Michael Kass, SIGGRAPH 1991) · Complex Patterns in a Simple System (John E. Pearson, Science, 1993). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "REACTION-DIFFUSION". Punchy sound design synced to every cut.
```
