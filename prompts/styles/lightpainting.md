# Light Painting

*Drawing with light on a long exposure · 1914 — · Analog, Physical & Stop Motion*

Reference film: `videos/lightpainting.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Light Painting** (Drawing with light on a long exposure, 1914 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Light painting is drawing in the air with a moving light while the camera's shutter stays open, so every path the light takes is written into a single photograph and the dimly lit performer barely registers. Frank and Lillian Gilbreth traced workers' motions with small lights in the 1910s, Man Ray signed his name in light in Space Writings (1935), and Gjon Mili's 1949 photographs for LIFE of Pablo Picasso drawing centaurs and bulls with a penlight made it famous. Today it is a performance genre of LED wands, pixel sticks and spinning steel wool.
- Study these reference works: Frank & Lillian Gilbreth — light motion studies (1910s) · Man Ray — Space Writings (1935) · Gjon Mili & Pablo Picasso — light drawings for LIFE (1949)
- Motion DNA: Nothing on screen moves except the light and the person carrying it; every path persists, so the image only ever accumulates: a coil grows across the frame, a ring spins up and sprays sparks, and a word is written stroke by stroke until the shutter closes.
- Visual DNA: Near-black blue-hour scene with a wet ground that mirrors the light, saturated RGB ribbon bands, orange spark parabolas with white-hot cores, a warm-white handwritten word, translucent ghosts of the performer, and minimal camera HUD type.
- Signature transitions: Shutter opens, wand coil, walk, steel-wool spin, walk, written word, shutter closes on the finished frame
- Key techniques: Additive exposure buffer, Parabolic spark streaks, Dwell-weighted ribbons

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Additive exposure buffer, Parabolic spark streaks, Dwell-weighted ribbons).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Additive exposure buffer and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LIGHT PAINTING", held for about 1 s.

BUILD RULES
- Suggested tools: Camera on tripod, bulb mode, LED wand / pixel stick, Steel wool on a cable, Canvas 2D (additive buffer). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Light Painting motion-graphics film (Drawing with light on a long exposure). Visual style: near-black blue-hour scene with a wet ground that mirrors the light, saturated RGB ribbon bands, orange spark parabolas with white-hot cores, a warm-white handwritten word, translucent ghosts of the performer, and minimal camera HUD type. Motion: nothing on screen moves except the light and the person carrying it; every path persists, so the image only ever accumulates: a coil grows across the frame, a ring spins up and sprays sparks, and a word is written stroke by stroke until the shutter closes. Signature moves: additive exposure buffer, parabolic spark streaks, dwell-weighted ribbons; transitions: shutter opens, wand coil, walk, steel-wool spin, walk, written word, shutter closes on the finished frame. In the tradition of Frank & Lillian Gilbreth — light motion studies (1910s) · Man Ray — Space Writings (1935) · Gjon Mili & Pablo Picasso — light drawings for LIFE (1949). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LIGHT PAINTING". Punchy sound design synced to every cut.
```
