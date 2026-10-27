# Long Exposure

*Light Trails · 1949 — · Cinematic & Film Language*

Reference film: `videos/longexposure.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Long Exposure** (Light Trails, 1949 —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Holding a camera shutter open turns moving light into drawn lines. Gjon Mili made it famous in 1949 when he photographed Pablo Picasso drawing centaurs and bulls in the air with a small flashlight for LIFE magazine, and night-traffic and star-trail photography made the streaking ribbon a fixed image of the modern city.
- Study these reference works: Picasso Draws with Light (Gjon Mili, LIFE, 1949) · Man Ray, Space Writing (1935) · Frank and Lillian Gilbreth, light-motion studies (1914) · Michael Wesely, open-shutter architecture (1997 —) · Lucas Zimmermann, Traffic Lights (2013) · Ken Russell / Koyaanisqatsi freeway time-lapses (Godfrey Reggio, 1982)
- Motion DNA: A locked-off tripod frame where nothing moves but light: the shutter clicks open, ribbons of head- and tail-lights pile up, the stars wheel, a figure signs the air, and the click of the shutter closing freezes it all.
- Visual DNA: Deep blue night lifted by hours of exposure, red and white highway ribbons, concentric star arcs, sodium lamps with diffraction spikes, a ghostly painter and a cyan light-written signature.
- Signature transitions: Mirror-slap blackout, shutter open, accumulation build, shutter close freeze, title written in light.
- Key techniques: Additive persistence computed from t (trail = road covered since shutter open), Perspective road samples with depth-scaled ribbon width, Star arcs around the celestial pole, Halving blur pyramid bloom + 6-blade diffraction stars

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Additive persistence computed from t (trail = road covered since shutter open), Perspective road samples with depth-scaled ribbon width, Star arcs around the celestial pole, Halving blur pyramid bloom + 6-blade diffraction stars).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Additive persistence computed from t (trail = road covered since shutter open) and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "LONG EXPOSURE", held for about 1 s.

BUILD RULES
- Suggested tools: Camera, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Long Exposure motion-graphics film (Light Trails). Visual style: deep blue night lifted by hours of exposure, red and white highway ribbons, concentric star arcs, sodium lamps with diffraction spikes, a ghostly painter and a cyan light-written signature. Motion: a locked-off tripod frame where nothing moves but light: the shutter clicks open, ribbons of head- and tail-lights pile up, the stars wheel, a figure signs the air, and the click of the shutter closing freezes it all. Signature moves: additive persistence computed from t (trail = road covered since shutter open), perspective road samples with depth-scaled ribbon width, star arcs around the celestial pole, halving blur pyramid bloom + 6-blade diffraction stars; transitions: mirror-slap blackout, shutter open, accumulation build, shutter close freeze, title written in light. In the tradition of Picasso Draws with Light (Gjon Mili, LIFE, 1949) · Man Ray, Space Writing (1935) · Frank and Lillian Gilbreth, light-motion studies (1914) · Michael Wesely, open-shutter architecture (1997 —) · Lucas Zimmermann, Traffic Lights (2013) · Ken Russell / Koyaanisqatsi freeway time-lapses (Godfrey Reggio, 1982). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "LONG EXPOSURE". Punchy sound design synced to every cut.
```
