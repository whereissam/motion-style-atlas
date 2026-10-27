# Double Exposure

*Two Frames, One Image · 1860s — · Cinematic & Film Language*

Reference film: `videos/doubleexposure.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Double Exposure** (Two Frames, One Image, 1860s —; family: Cinematic & Film Language).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Exposing the same frame twice was first a darkroom accident, then a spirit-photography trick in the 1860s and a staple of silent-film dream sequences. The modern portrait-plus-landscape look, a silhouette filled with forest or city, came through album covers and posters and was fixed in motion by Elastic's 2014 title sequence for True Detective.
- Study these reference works: True Detective season 1 titles (Elastic, Patrick Clair, 2014) · The Man with the Rubber Head (Georges Méliès, 1901) · Vertigo title sequence (Saul Bass, 1958) · Christoffer Relander, We Are Nature (2012) · Dan Mountford, double-exposure portraits (2011) · Andreas Lie, Wilderness portraits (2013)
- Motion DNA: Slow and breathing: a drift through misty pines pulls back to reveal a head, birds burst out past its edge, smoke rolls the forest into a city at dusk, and a heartbeat pulse carries it to a quiet type lockup.
- Visual DNA: A pale paper ground, a profile silhouette filled with layered pines, mountains and towers, desaturated slate and fog tones with a single warm sun set behind the eye, film grain and soft vignette.
- Signature transitions: Pull-back reveal, bird scatter, smoke dissolve between landscapes, smoke-revealed title.
- Key techniques: Screen blend: dark portrait prints the landscape, bright sky stays paper, Parallax landscape layers drawn under a shared camera, fbm noise threshold as a smoke dissolve (with glowing rim), Multiply-blended type revealed through the same smoke

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Screen blend: dark portrait prints the landscape, bright sky stays paper, Parallax landscape layers drawn under a shared camera, fbm noise threshold as a smoke dissolve (with glowing rim), Multiply-blended type revealed through the same smoke).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Screen blend: dark portrait prints the landscape, bright sky stays paper and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DOUBLE EXPOSURE", held for about 1 s.

BUILD RULES
- Suggested tools: Camera, Photoshop, After Effects, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs live action (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Double Exposure motion-graphics film (Two Frames, One Image). Visual style: a pale paper ground, a profile silhouette filled with layered pines, mountains and towers, desaturated slate and fog tones with a single warm sun set behind the eye, film grain and soft vignette. Motion: slow and breathing: a drift through misty pines pulls back to reveal a head, birds burst out past its edge, smoke rolls the forest into a city at dusk, and a heartbeat pulse carries it to a quiet type lockup. Signature moves: screen blend: dark portrait prints the landscape, bright sky stays paper, parallax landscape layers drawn under a shared camera, fbm noise threshold as a smoke dissolve (with glowing rim), multiply-blended type revealed through the same smoke; transitions: pull-back reveal, bird scatter, smoke dissolve between landscapes, smoke-revealed title. In the tradition of True Detective season 1 titles (Elastic, Patrick Clair, 2014) · The Man with the Rubber Head (Georges Méliès, 1901) · Vertigo title sequence (Saul Bass, 1958) · Christoffer Relander, We Are Nature (2012) · Dan Mountford, double-exposure portraits (2011) · Andreas Lie, Wilderness portraits (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DOUBLE EXPOSURE". Punchy sound design synced to every cut.
```
