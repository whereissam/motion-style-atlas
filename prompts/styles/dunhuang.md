# Dunhuang Murals

*Mogao 敦煌壁画 · 4th–14th c. · Cultural & Regional*

Reference film: `videos/dunhuang.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dunhuang Murals** (Mogao 敦煌壁画, 4th–14th c.; family: Cultural & Regional).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Over a thousand years, painters on the Silk Road covered the Mogao Caves near Dunhuang with mineral-pigment murals of Buddhist paradises, where flying apsaras (feitian) ride on trailing silk scarves. The Shanghai Animation Film Studio adapted the Cave 257 jataka into Nine-Coloured Deer in 1981.
- Study these reference works: Mogao Cave 257 Deer King Jataka (Northern Wei) · Cave 320 flying apsaras (Tang) · Cave 407 three-hare lotus ceiling (Sui) · Nine-Coloured Deer (Shanghai Animation Film Studio, 1981) · Dream of Dunhuang dance drama (Gansu, 1979)
- Motion DNA: Slow weightless glides on long curves, with the silk scarves doing the dancing: they trail the path, twist to show both faces, and keep rippling after the figure comes to rest.
- Visual DNA: Malachite, lapis, cinnabar and ochre on an earth-red ground, darkened flesh shading and fine iron-wire lines, under a skin of cracks and flaking plaster.
- Signature transitions: Lamp-light reveal, slow pull-back, ring-by-ring lotus bloom, flower rain, cartouche fade-in
- Key techniques: Mineral pigments on plaster, Iron-wire outline & contour shading, Trailing-scarf secondary motion

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Mineral pigments on plaster, Iron-wire outline & contour shading, Trailing-scarf secondary motion).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Mineral pigments on plaster and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DUNHUANG MURALS", held for about 1 s.

BUILD RULES
- Suggested tools: Mineral pigment on plaster, Procreate / Photoshop + AE, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dunhuang Murals motion-graphics film (Mogao 敦煌壁画). Visual style: malachite, lapis, cinnabar and ochre on an earth-red ground, darkened flesh shading and fine iron-wire lines, under a skin of cracks and flaking plaster. Motion: slow weightless glides on long curves, with the silk scarves doing the dancing: they trail the path, twist to show both faces, and keep rippling after the figure comes to rest. Signature moves: mineral pigments on plaster, iron-wire outline & contour shading, trailing-scarf secondary motion; transitions: lamp-light reveal, slow pull-back, ring-by-ring lotus bloom, flower rain, cartouche fade-in. In the tradition of Mogao Cave 257 Deer King Jataka (Northern Wei) · Cave 320 flying apsaras (Tang) · Cave 407 three-hare lotus ceiling (Sui) · Nine-Coloured Deer (Shanghai Animation Film Studio, 1981) · Dream of Dunhuang dance drama (Gansu, 1979). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DUNHUANG MURALS". Punchy sound design synced to every cut.
```
