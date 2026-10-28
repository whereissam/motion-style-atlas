# Object Stop Motion

*Everyday Things, Frame by Frame · 1907 — · Analog, Physical & Stop Motion*

Reference film: `videos/objectstop.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Object Stop Motion** (Everyday Things, Frame by Frame, 1907 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Instead of puppets or clay, real household objects are moved a fraction between exposures so they seem to act on their own. J. Stuart Blackton's The Haunted Hotel (1907) had a breakfast table lay itself; Norman McLaren extended the trick to people as pixilation in Neighbours (1952); Jan Švankmajer turned food and utensils into uncanny actors; and PES made food out of non-food — Rubik's cubes, bubble wrap and Post-it notes — in Western Spaghetti (2008).
- Study these reference works: The Haunted Hotel (J. Stuart Blackton, 1907) · Neighbours (Norman McLaren, 1952) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Food (Jan Švankmajer, 1992) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012)
- Motion DNA: Everything moves in 12 fps steps, as if nudged by an unseen hand: props shuffle in and hop to their marks, a paper egg spreads in a few exposures, beads re-scatter every frame like sizzling fat, and every resting object shivers by a pixel or two.
- Visual DNA: A warm overhead view of a pine tabletop with real drop shadows: a cast-iron pan on a ring of sticky-note flames, a golf-ball egg with a yellow button yolk, cork toast, ribbon bacon, a blue-rimmed plate and wooden letter tiles, under a faintly flickering key light.
- Signature transitions: None — props enter and exit the locked frame by hand; the title is spelled with tiles on the table
- Key techniques: Shot on twos at 12 fps, Object substitution (things stand in for food), Locked overhead camera on a tabletop, Per-frame placement jitter & light flicker

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Shot on twos at 12 fps, Object substitution (things stand in for food), Locked overhead camera on a tabletop, Per-frame placement jitter & light flicker).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Shot on twos at 12 fps and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "OBJECT STOP MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: DSLR on an overhead rig + Dragonframe, Hand-placed props, onion-skin checks, Canvas 2D (12 fps quantised time, cached exposures). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Procedural homage (the real thing is shot frame by frame).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Object Stop Motion motion-graphics film (Everyday Things, Frame by Frame). Visual style: a warm overhead view of a pine tabletop with real drop shadows: a cast-iron pan on a ring of sticky-note flames, a golf-ball egg with a yellow button yolk, cork toast, ribbon bacon, a blue-rimmed plate and wooden letter tiles, under a faintly flickering key light. Motion: everything moves in 12 fps steps, as if nudged by an unseen hand: props shuffle in and hop to their marks, a paper egg spreads in a few exposures, beads re-scatter every frame like sizzling fat, and every resting object shivers by a pixel or two. Signature moves: shot on twos at 12 fps, object substitution (things stand in for food), locked overhead camera on a tabletop, per-frame placement jitter & light flicker; transitions: none — props enter and exit the locked frame by hand; the title is spelled with tiles on the table. In the tradition of The Haunted Hotel (J. Stuart Blackton, 1907) · Neighbours (Norman McLaren, 1952) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Food (Jan Švankmajer, 1992) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "OBJECT STOP MOTION". Punchy sound design synced to every cut.
```
