# Y2K Graphic Design

*Chrome Tech-Optimism · 1997 — 2004 · Graphic Design & Historical*

Reference film: `videos/y2k.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Y2K Graphic Design** (Chrome Tech-Optimism, 1997 — 2004; family: Graphic Design & Historical).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Millennium-era graphics fused tech optimism with the new 3D and vector tools: liquid chrome type, translucent candy plastic popularised by the 1998 iMac G3, HUD-like grids and pixel fonts, pushed furthest by Sheffield studio The Designers Republic.
- Study these reference works: iMac G3 Bondi Blue (Apple, 1998) · Wipeout 2097 packaging & HUD (The Designers Republic, 1996) · Warp Records sleeves (The Designers Republic, 1990s) · Sony PlayStation 2 launch identity (2000) · Windows XP Luna theme (2001)
- Motion DNA: Liquid and snappy: chrome blobs drop, split and orbit like mercury, candy capsules spring into line, HUD markers snap, and blobs fuse into bubble letters on the drop.
- Visual DNA: Iridescent chrome with a dark horizon line, ice-silver backgrounds, translucent aqua and candy plastics, lens rings, crosshairs, barcodes, 4-point star sparkles and tiny pixel type.
- Signature transitions: Mercury split, capsule carousel, blob converge, white flash, gooey glyph morph, shine sweep
- Key techniques: Environment-mapped liquid chrome, Translucent candy plastic, Pixel micro-type & HUD grids

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Environment-mapped liquid chrome, Translucent candy plastic, Pixel micro-type & HUD grids).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Environment-mapped liquid chrome and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "Y2K GRAPHIC DESIGN", held for about 1 s.

BUILD RULES
- Suggested tools: Cinema 4D / 3ds Max, Illustrator + Photoshop, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Y2K Graphic Design motion-graphics film (Chrome Tech-Optimism). Visual style: iridescent chrome with a dark horizon line, ice-silver backgrounds, translucent aqua and candy plastics, lens rings, crosshairs, barcodes, 4-point star sparkles and tiny pixel type. Motion: liquid and snappy: chrome blobs drop, split and orbit like mercury, candy capsules spring into line, HUD markers snap, and blobs fuse into bubble letters on the drop. Signature moves: environment-mapped liquid chrome, translucent candy plastic, pixel micro-type & hud grids; transitions: mercury split, capsule carousel, blob converge, white flash, gooey glyph morph, shine sweep. In the tradition of iMac G3 Bondi Blue (Apple, 1998) · Wipeout 2097 packaging & HUD (The Designers Republic, 1996) · Warp Records sleeves (The Designers Republic, 1990s) · Sony PlayStation 2 launch identity (2000) · Windows XP Luna theme (2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "Y2K GRAPHIC DESIGN". Punchy sound design synced to every cut.
```
