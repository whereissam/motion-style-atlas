# Vaporwave

*Mall-soft Nostalgia · 2010 — · Digital, Internet & Screen*

Reference film: `videos/vaporwave.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Vaporwave** (Mall-soft Nostalgia, 2010 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: An internet microgenre that slowed, looped and pitched down 1980s–90s muzak, smooth jazz and corporate pop; its visual language of classical busts, early Windows chrome, katakana and sunset grids formed on Tumblr and Bandcamp around 2010–2012.
- Study these reference works: Macintosh Plus — Floral Shoppe (2011) · Chuck Person — Eccojams Vol. 1 (2010) · James Ferraro — Far Side Virtual (2011) · Saint Pepsi — Hit Vibes (2013)
- Motion DNA: Slowed, looping, deliberately stalled motion: beats repeat, the tape rewinds and fast-forwards instead of cutting.
- Visual DNA: Marble statuary, pink/teal sunset gradients, perspective grids, fullwidth type and katakana, early-OS windows, all under VHS artefacts.
- Signature transitions: VHS tracking roll, rewind stutter, fast-forward, Win95 zoom-open, window drag trail, snow cut
- Key techniques: Classical bust + sunset grid, Win95 chrome & error cascades, VHS wobble, chopped & screwed time

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Classical bust + sunset grid, Win95 chrome & error cascades, VHS wobble, chopped & screwed time).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Classical bust + sunset grid and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VAPORWAVE", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Canvas 2D, VHS emulation. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Vaporwave motion-graphics film (Mall-soft Nostalgia). Visual style: marble statuary, pink/teal sunset gradients, perspective grids, fullwidth type and katakana, early-OS windows, all under VHS artefacts. Motion: slowed, looping, deliberately stalled motion: beats repeat, the tape rewinds and fast-forwards instead of cutting. Signature moves: classical bust + sunset grid, win95 chrome & error cascades, vhs wobble, chopped & screwed time; transitions: vHS tracking roll, rewind stutter, fast-forward, Win95 zoom-open, window drag trail, snow cut. In the tradition of Macintosh Plus — Floral Shoppe (2011) · Chuck Person — Eccojams Vol. 1 (2010) · James Ferraro — Far Side Virtual (2011) · Saint Pepsi — Hit Vibes (2013). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VAPORWAVE". Punchy sound design synced to every cut.
```
