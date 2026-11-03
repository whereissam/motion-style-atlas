# Chiaroscuro

*One hard light, and darkness for the rest · 1600 — · Rendering Looks*

Reference film: `videos/lookchiaroscuro.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Chiaroscuro** (One hard light, and darkness for the rest, 1600 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Chiaroscuro (Italian, “light-dark”) names the modelling of form by strong contrast of light and shade, developed in Renaissance drawing and painting. Caravaggio pushed it to tenebrism around 1600: a single high, raking light, figures emerging from near-black, as in The Calling of Saint Matthew (1599–1600). Rembrandt made a gentler, warmer low key his own in the following decades, and portrait photographers still call a key set high and to the side “Rembrandt lighting”. Film noir cinematographers carried the idea into black-and-white cinema in the 1940s; in rendering it is a single shadowed spot light, a high key-to-fill ratio and nothing else.
- Study these reference works: The Calling of Saint Matthew (Caravaggio, 1599–1600) · The Night Watch (Rembrandt, 1642) · The Third Man (Carol Reed, cinematography Robert Krasker, 1949)
- Motion DNA: The shared 50° orbit with the Token turning and bobbing, under a lamp that drifts a few degrees and rises and falls a little, so the terminators and the shadow edges creep across the forms. A wipe opens the dark set from the plain reference; then the fill steps down on the beat, 6:1 → 21:1 → 80:1, and the shadows sink from deep brown to black while the lit planes stay put.
- Visual DNA: Near-black umber ground with a faint warm spill on the unseen wall; a warm hard key raking the orange Token, an ivory sphere and a deep blue cube on a dark wooden table, crisp cast shadows, a narrow pool of light that dies within a metre or two, a vignette and fine grain. A notan inset in ink and bone, a key-to-fill readout, and the light zones of the ball labelled on the sphere, then the lamp–form–shadow triangle drawn in dashes.
- Signature transitions: Wipe from the plain reference to the dark set; the fill steps down on the beat
- Key techniques: Single hard spot, inverse-square falloff, High key-to-fill ratio, Notan: two-value design

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Single hard spot, inverse-square falloff, High key-to-fill ratio, Notan: two-value design).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Single hard spot, inverse-square falloff and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CHIAROSCURO", held for about 1 s.

BUILD RULES
- Suggested tools: Cinematography: one hard key, flags and no fill (negative fill); key-to-fill ratio metered in stops, Spot light with cone falloff and inverse-square decay, ambient near zero (Blender, Arnold, Unreal), Canvas 2D + SDF tracer (js/look-kit.js): point light in a smoothstep cone, inverse-square falloff, hard LK.shadow (k 48), AO-weighted fill stepped down on the beat, floor bounce term, vignette + frame-seeded grain, notan threshold in post. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Chiaroscuro motion-graphics film (One hard light, and darkness for the rest). Visual style: near-black umber ground with a faint warm spill on the unseen wall; a warm hard key raking the orange Token, an ivory sphere and a deep blue cube on a dark wooden table, crisp cast shadows, a narrow pool of light that dies within a metre or two, a vignette and fine grain. A notan inset in ink and bone, a key-to-fill readout, and the light zones of the ball labelled on the sphere, then the lamp–form–shadow triangle drawn in dashes. Motion: the shared 50° orbit with the Token turning and bobbing, under a lamp that drifts a few degrees and rises and falls a little, so the terminators and the shadow edges creep across the forms. A wipe opens the dark set from the plain reference; then the fill steps down on the beat, 6:1 → 21:1 → 80:1, and the shadows sink from deep brown to black while the lit planes stay put. Signature moves: single hard spot, inverse-square falloff, high key-to-fill ratio, notan: two-value design; transitions: wipe from the plain reference to the dark set; the fill steps down on the beat. In the tradition of The Calling of Saint Matthew (Caravaggio, 1599–1600) · The Night Watch (Rembrandt, 1642) · The Third Man (Carol Reed, cinematography Robert Krasker, 1949). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CHIAROSCURO". Punchy sound design synced to every cut.
```
