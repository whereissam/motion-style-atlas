# Clay Stop Motion

*Claymation · 1955 — · Analog, Physical & Stop Motion*

Reference film: `videos/claymation.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Clay Stop Motion** (Claymation, 1955 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Plasticine figures are re-sculpted by hand and photographed one frame at a time. Art Clokey's Gumby made it a TV staple in 1955; Will Vinton's studio coined "Claymation" in the late 1970s and Aardman refined it.
- Study these reference works: Gumby (Art Clokey, 1955) · Closed Mondays (Will Vinton & Bob Gardiner, 1974) · A Grand Day Out (Nick Park, 1989) · Creature Comforts (Aardman, 1989) · Chicken Run (2000)
- Motion DNA: Stepped 12 fps poses with broad squash and stretch, plus a faint boil as the clay is touched between frames.
- Visual DNA: Soft, matte plasticine with fingerprints and tool marks, lit like a miniature set whose exposure flickers slightly from frame to frame.
- Signature transitions: Morph, squash, clay smear, pop-in replacement
- Key techniques: Shot on twos · 12 fps, Thumbprints & shape boil, Plasticine squash & stretch

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Shot on twos · 12 fps, Thumbprints & shape boil, Plasticine squash & stretch).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Shot on twos · 12 fps and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "CLAY STOP MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Dragonframe, Stop-motion rig, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Clay Stop Motion motion-graphics film (Claymation). Visual style: soft, matte plasticine with fingerprints and tool marks, lit like a miniature set whose exposure flickers slightly from frame to frame. Motion: stepped 12 fps poses with broad squash and stretch, plus a faint boil as the clay is touched between frames. Signature moves: shot on twos · 12 fps, thumbprints & shape boil, plasticine squash & stretch; transitions: morph, squash, clay smear, pop-in replacement. In the tradition of Gumby (Art Clokey, 1955) · Closed Mondays (Will Vinton & Bob Gardiner, 1974) · A Grand Day Out (Nick Park, 1989) · Creature Comforts (Aardman, 1989) · Chicken Run (2000). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "CLAY STOP MOTION". Punchy sound design synced to every cut.
```
