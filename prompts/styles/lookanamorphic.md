# Anamorphic Flare

*Horizontal streaks, oval bokeh, 2.39:1 · 1953 — · Rendering Looks*

Reference film: `videos/lookanamorphic.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Anamorphic Flare** (Horizontal streaks, oval bokeh, 2.39:1, 1953 —; family: Rendering Looks).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Anamorphic lenses squeeze a wide image horizontally onto ordinary film and stretch it back in projection. Henri Chrétien’s Hypergonar of the 1920s was the basis of 20th Century Fox’s CinemaScope, launched with The Robe in 1953; Panavision’s anamorphic lenses later became the standard, and the projected 2.39:1 frame the shape of the widescreen epic. The cylindrical optics leave a signature that spherical lenses do not: bright sources flare into long horizontal streaks, often blue, and out-of-focus highlights turn into vertical ovals. Filmmakers came to court those artefacts, and renderers imitate them in post with thresholded, one-directional blurs.
- Study these reference works: The Robe (Henry Koster, 1953; the first CinemaScope feature) · Close Encounters of the Third Kind (Steven Spielberg, 1977; anamorphic flares from the ship’s lights) · Star Trek (J. J. Abrams, 2009; deliberate blue streak flares)
- Motion DNA: The camera makes the shared 50° orbit around a night-lit still life with a practical bulb hanging behind it. The frame closes to a 2.39:1 letterbox, then a wipe swaps the spherical lens for the anamorphic one: round bokeh stretch into tall ovals and the bulb and speculars flare sideways. The streak length steps up on the beat, the threshold and streak passes appear as insets, the squeezed negative and its desqueeze are shown, and the streak runs across the whole frame for the finish.
- Visual DNA: Near-black studio, the orange Token and the glossy sphere and cube picked out by a hard key and a warm bulb, a row of amber and blue background lights blown into soft tall ovals; thin electric-blue streaks crossing the frame through every hot point, faint oval ghosts mirrored through the centre; black letterbox bars carrying mono readouts.
- Signature transitions: Letterbox close, then a wipe from spherical to anamorphic lens
- Key techniques: Threshold → horizontal exponential blur, Vertical oval bokeh (1 : 1.8), 2× squeeze, 2.39:1 letterbox

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Threshold → horizontal exponential blur, Vertical oval bokeh (1 : 1.8), 2× squeeze, 2.39:1 letterbox).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Threshold → horizontal exponential blur and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ANAMORPHIC FLARE", held for about 1 s.

BUILD RULES
- Suggested tools: Lens-flare and anamorphic-streak plug-ins (Optical Flares, Sapphire), Engine post: bright-pass, one-axis blur, additive composite, Canvas 2D + SDF tracer (js/look-kit.js): HDR night shading with an analytic bulb, opts.post oval bokeh with depth-tested occlusion and a two-sided exponential streak filter per row. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Anamorphic Flare motion-graphics film (Horizontal streaks, oval bokeh, 2.39:1). Visual style: near-black studio, the orange Token and the glossy sphere and cube picked out by a hard key and a warm bulb, a row of amber and blue background lights blown into soft tall ovals; thin electric-blue streaks crossing the frame through every hot point, faint oval ghosts mirrored through the centre; black letterbox bars carrying mono readouts. Motion: the camera makes the shared 50° orbit around a night-lit still life with a practical bulb hanging behind it. The frame closes to a 2.39:1 letterbox, then a wipe swaps the spherical lens for the anamorphic one: round bokeh stretch into tall ovals and the bulb and speculars flare sideways. The streak length steps up on the beat, the threshold and streak passes appear as insets, the squeezed negative and its desqueeze are shown, and the streak runs across the whole frame for the finish. Signature moves: threshold → horizontal exponential blur, vertical oval bokeh (1 : 1.8), 2× squeeze, 2.39:1 letterbox; transitions: letterbox close, then a wipe from spherical to anamorphic lens. In the tradition of The Robe (Henry Koster, 1953; the first CinemaScope feature) · Close Encounters of the Third Kind (Steven Spielberg, 1977; anamorphic flares from the ship’s lights) · Star Trek (J. J. Abrams, 2009; deliberate blue streak flares). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ANAMORPHIC FLARE". Punchy sound design synced to every cut.
```
