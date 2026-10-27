# Xerox Motion

*Photocopy Zine · 1976 — · Analog, Physical & Stop Motion*

Reference film: `videos/xerox.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Xerox Motion** (Photocopy Zine, 1976 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Punk flyers and fanzines were cut, pasted and run through office photocopiers. Designers later animated the copier's own defects: toner noise, light-bar streaks, misregistration and generation loss.
- Study these reference works: Sniffin' Glue (Mark Perry, 1976) · Sex Pistols graphics (Jamie Reid, 1977) · Search & Destroy (V. Vale, 1977) · Black Flag flyers (Raymond Pettibon, late 1970s)
- Motion DNA: Choppy 8 fps cuts, copier light-bar sweeps and images that degrade a little more with every copy.
- Visual DNA: Black toner on coloured paper, misregistered spot colour, speckle, streaks and crooked paste-ups.
- Signature transitions: Light-bar scan, generation-loss cut, scan smear, negative flip
- Key techniques: 1-bit threshold + toner noise, Copy-of-a-copy generation loss, Ransom-note cut-and-paste type

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (1-bit threshold + toner noise, Copy-of-a-copy generation loss, Ransom-note cut-and-paste type).
- 5.0–8.0 s  Climax: the most spectacular moment, built on 1-bit threshold + toner noise and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "XEROX MOTION", held for about 1 s.

BUILD RULES
- Suggested tools: Photocopier + scanner, After Effects, Canvas 2D (procedural homage). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Needs physical capture (this film is a procedural homage).

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Xerox Motion motion-graphics film (Photocopy Zine). Visual style: black toner on coloured paper, misregistered spot colour, speckle, streaks and crooked paste-ups. Motion: choppy 8 fps cuts, copier light-bar sweeps and images that degrade a little more with every copy. Signature moves: 1-bit threshold + toner noise, copy-of-a-copy generation loss, ransom-note cut-and-paste type; transitions: light-bar scan, generation-loss cut, scan smear, negative flip. In the tradition of Sniffin' Glue (Mark Perry, 1976) · Sex Pistols graphics (Jamie Reid, 1977) · Search & Destroy (V. Vale, 1977) · Black Flag flyers (Raymond Pettibon, late 1970s). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "XEROX MOTION". Punchy sound design synced to every cut.
```
