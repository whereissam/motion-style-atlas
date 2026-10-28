# Grunge Typography

*Distressed, Layered, Illegible · 1990 — 1999 · Graphic Design & Historical*

Reference film: `videos/grunge.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Grunge Typography** (Distressed, Layered, Illegible, 1990 — 1999; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The early-’90s reaction against Swiss order, made possible by the Macintosh: Emigre magazine (Rudy VanderLans and Zuzana Licko, from 1984) and its bitmap and distressed faces, Neville Brody’s experimental type magazine Fuse (from 1991), and above all David Carson’s art direction of Ray Gun (1992–95), which overlapped columns, cropped headlines off the page and once set an entire Bryan Ferry interview in Zapf Dingbats. Kyle Cooper’s hand-scratched, jittering title sequence for Se7en (1995) carried the look into motion and defined a decade of film and music-video titles.
- Study these reference works: Ray Gun (David Carson, 1992–95) · The End of Print (Carson and Lewis Blackwell, 1995) · Se7en title sequence (Kyle Cooper / R/GA, 1995) · Fuse (Neville Brody and Jon Wozencroft, 1991—) · Emigre magazine (VanderLans and Licko, 1984–2005) · Template Gothic (Barry Deck, 1990) · Beach Culture (Carson, 1989–91)
- Motion DNA: Nervous and handmade: the frame weaves and stutters on twos, scratched words flicker in double exposure, layers slide over each other at different speeds, letters jitter into place and the page tears into horizontal slices before the film slips its frame line.
- Visual DNA: Dirty bone paper and black, one rust accent; heavy condensed sans against Bodoni italic and typewriter, letters overprinted and eroded, columns colliding with blurred photographs, giant cropped words, hairline rules, folios and dingbats.
- Signature transitions: Hard cut from scratched film to print, staggered layer slides, slab shove, slice tear, frame-line slip
- Key techniques: Pre-eroded type through a distress texture, Gate weave and doubled exposures on twos, Overlapping justified columns, Self-sampled slice displacement

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pre-eroded type through a distress texture, Gate weave and doubled exposures on twos, Overlapping justified columns, Self-sampled slice displacement).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pre-eroded type through a distress texture and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GRUNGE TYPOGRAPHY", held for about 1 s.

BUILD RULES
- Suggested tools: QuarkXPress + photocopier, Scratched 35 mm film (Se7en), After Effects with Twitch / Wiggle, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Grunge Typography motion-graphics film (Distressed, Layered, Illegible). Visual style: dirty bone paper and black, one rust accent; heavy condensed sans against Bodoni italic and typewriter, letters overprinted and eroded, columns colliding with blurred photographs, giant cropped words, hairline rules, folios and dingbats. Motion: nervous and handmade: the frame weaves and stutters on twos, scratched words flicker in double exposure, layers slide over each other at different speeds, letters jitter into place and the page tears into horizontal slices before the film slips its frame line. Signature moves: pre-eroded type through a distress texture, gate weave and doubled exposures on twos, overlapping justified columns, self-sampled slice displacement; transitions: hard cut from scratched film to print, staggered layer slides, slab shove, slice tear, frame-line slip. In the tradition of Ray Gun (David Carson, 1992–95) · The End of Print (Carson and Lewis Blackwell, 1995) · Se7en title sequence (Kyle Cooper / R/GA, 1995) · Fuse (Neville Brody and Jon Wozencroft, 1991—) · Emigre magazine (VanderLans and Licko, 1984–2005) · Template Gothic (Barry Deck, 1990) · Beach Culture (Carson, 1989–91). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GRUNGE TYPOGRAPHY". Punchy sound design synced to every cut.
```
