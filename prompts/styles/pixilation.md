# Pixilation

*Live actors, one frame at a time · 1908 — · Analog, Physical & Stop Motion*

Reference film: `videos/pixilation.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pixilation** (Live actors, one frame at a time, 1908 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Pixilation animates real people and objects with the stop-motion camera: actors hold a pose for each exposure, move a little, and hold again, so on screen they glide, levitate and change clothes without ever walking. Émile Cohl and Segundo de Chomón used the trick in the 1900s; Norman McLaren made it an art form at the National Film Board of Canada with Neighbours (1952), which won an Academy Award, and the technique returned in music videos with Peter Gabriel’s Sledgehammer and in the short films of PES.
- Study these reference works: Neighbours (Norman McLaren, NFB, 1952) · A Chairy Tale (Norman McLaren & Claude Jutra, 1957) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, with Aardman and the Brothers Quay, 1986) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012)
- Motion DNA: Time is chopped into exposures: people slide along the ground with their legs locked, hop through the air without ever landing, sit on nothing and drive, and swap clothes, poses and places at every cut, while a little jitter between frames keeps every held pose alive.
- Visual DNA: Ordinary daylight locations shot on film: a park lawn with mowing stripes, railings, terraced houses and a street; actors in period clothes lit like photographs with a hard key light, contact shadows that stay on the grass, heavy grain, gate weave and slight exposure flicker from frame to frame.
- Signature transitions: Glide-in, levitating hop, bow, jump cuts on the third of a second, invisible-car ride, letter-per-frame title placement
- Key techniques: Stepped 12 fps exposures, Airborne-every-frame hops, Jump-cut costume swaps

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Stepped 12 fps exposures, Airborne-every-frame hops, Jump-cut costume swaps).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Stepped 12 fps exposures and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PIXILATION", held for about 1 s.

BUILD RULES
- Suggested tools: Film or DSLR camera with intervalometer, actors posed per frame, Dragonframe / Stop Motion Studio onion skinning, Canvas 2D (time quantised to 12 fps). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pixilation motion-graphics film (Live actors, one frame at a time). Visual style: ordinary daylight locations shot on film: a park lawn with mowing stripes, railings, terraced houses and a street; actors in period clothes lit like photographs with a hard key light, contact shadows that stay on the grass, heavy grain, gate weave and slight exposure flicker from frame to frame. Motion: time is chopped into exposures: people slide along the ground with their legs locked, hop through the air without ever landing, sit on nothing and drive, and swap clothes, poses and places at every cut, while a little jitter between frames keeps every held pose alive. Signature moves: stepped 12 fps exposures, airborne-every-frame hops, jump-cut costume swaps; transitions: glide-in, levitating hop, bow, jump cuts on the third of a second, invisible-car ride, letter-per-frame title placement. In the tradition of Neighbours (Norman McLaren, NFB, 1952) · A Chairy Tale (Norman McLaren & Claude Jutra, 1957) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, with Aardman and the Brothers Quay, 1986) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PIXILATION". Punchy sound design synced to every cut.
```
