# Wipe

*A hard edge travels, a new picture follows · 1910s — · Technique Atlas*

Reference film: `videos/techwipe.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Wipe** (A hard edge travels, a new picture follows, 1910s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A wipe replaces one image with another behind a moving edge. Early cinema already used iris and shaped mask transitions, and optical printers with travelling mattes made line, clock and pattern wipes routine by the 1930s. Akira Kurosawa cut Seven Samurai (1954) with crisp wipes, and George Lucas borrowed them, clock wipes included, for Star Wars (1977); video switchers later put a menu of wipe patterns on a single lever.
- Study these reference works: Seven Samurai (Akira Kurosawa, 1954) · Star Wars (George Lucas, 1977) · Looney Tunes iris-out endings (Warner Bros.)
- Motion DNA: Nothing in either picture moves; only the boundary does. Each wipe runs exactly one bar of half-beats on its own ease — a tilted line crosses left to right, a hand sweeps a full clock turn from twelve, an iris opens from the Token’s centre, and the Token’s own silhouette grows exponentially until it fills the frame — with a held beat of the new state between.
- Visual DNA: The Technique Atlas stage repeated in five states: the Token turned a quarter further each time and recoloured orange, ink, blue, outline, orange again; the grid shifts and zooms between states; an orange accent line rides each matte edge; a mono state label in the top-right corner gets wiped with its picture.
- Signature transitions: Linear wipe, clock wipe, iris wipe, shaped (Token-silhouette) wipe
- Key techniques: Moving matte as clip path, Hard edge, no blend, Shape wipe from the subject

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Moving matte as clip path, Hard edge, no blend, Shape wipe from the subject).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Moving matte as clip path and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "WIPE", held for about 1 s.

BUILD RULES
- Suggested tools: Optical printer with travelling mattes, Video switcher wipe patterns / After Effects track mattes, Canvas 2D: clip path per matte over the previous state. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Wipe motion-graphics film (A hard edge travels, a new picture follows). Visual style: the Technique Atlas stage repeated in five states: the Token turned a quarter further each time and recoloured orange, ink, blue, outline, orange again; the grid shifts and zooms between states; an orange accent line rides each matte edge; a mono state label in the top-right corner gets wiped with its picture. Motion: nothing in either picture moves; only the boundary does. Each wipe runs exactly one bar of half-beats on its own ease — a tilted line crosses left to right, a hand sweeps a full clock turn from twelve, an iris opens from the Token’s centre, and the Token’s own silhouette grows exponentially until it fills the frame — with a held beat of the new state between. Signature moves: moving matte as clip path, hard edge, no blend, shape wipe from the subject; transitions: linear wipe, clock wipe, iris wipe, shaped (Token-silhouette) wipe. In the tradition of Seven Samurai (Akira Kurosawa, 1954) · Star Wars (George Lucas, 1977) · Looney Tunes iris-out endings (Warner Bros.). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "WIPE". Punchy sound design synced to every cut.
```
