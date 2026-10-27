# Glitch / Datamosh

*Beautiful Errors · 2005 — · Digital, Internet & Screen*

Reference film: `videos/glitch.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Glitch / Datamosh** (Beautiful Errors, 2005 —; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Digital compression errors turned into an aesthetic. The cyan-red offset of TikTok's logo is its pop descendant.
- Study these reference works: Takeshi Murata, Monster Movie (2005) · Welcome to Heartbreak (2009)
- Motion DNA: Clean signal interrupted by frame-rate bursts of error that build to a full breakdown.
- Visual DNA: Channel offsets, macroblocks, static, monospace HUD.
- Signature transitions: Datamosh melt, static cut, reconnect
- Key techniques: RGB split, Slice displacement, Pixel melt

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (RGB split, Slice displacement, Pixel melt).
- 5.0–8.0 s  Climax: the most spectacular moment, built on RGB split and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GLITCH / DATAMOSH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects, Avidemux, Canvas 2D, GLSL. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Glitch / Datamosh motion-graphics film (Beautiful Errors). Visual style: channel offsets, macroblocks, static, monospace HUD. Motion: clean signal interrupted by frame-rate bursts of error that build to a full breakdown. Signature moves: rgb split, slice displacement, pixel melt; transitions: datamosh melt, static cut, reconnect. In the tradition of Takeshi Murata, Monster Movie (2005) · Welcome to Heartbreak (2009). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GLITCH / DATAMOSH". Punchy sound design synced to every cut.
```
