# Retro Desktop UI

*Windows, Icons, Menus, Pointer · 1984 — 2001 · Digital, Internet & Screen*

Reference film: `videos/desktop.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Retro Desktop UI** (Windows, Icons, Menus, Pointer, 1984 — 2001; family: Digital, Internet & Screen).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: The graphical desktop metaphor born at Xerox PARC (Alto, 1973; Star, 1981) reached the public with the 1-bit Apple Macintosh in 1984, became mass culture with Windows 95’s Start button and taskbar, and peaked in the glossy Luna theme of Windows XP in 2001.
- Study these reference works: Xerox Star 8010 (1981) · Apple Macintosh System 1, icons by Susan Kare (1984) · Windows 95 (1995) · Microsoft Solitaire win cascade, Wes Cherry (1990) · Windows XP Luna (2001)
- Motion DNA: The cursor is the protagonist: every move is a double-click, drag or menu pull answered by zoom rectangles, inverted highlights and a progress bar.
- Visual DNA: Native-resolution pixels scaled up crisp: 1-bit checker gray and striped title bars, teal desktop with grey 3D bevels and navy captions, then Luna blue glass, green Start and rolling-hill wallpaper.
- Signature transitions: Zoom-rect open, dithered dissolve, caption-bar zoom, Solitaire trail cascade, display mode-switch blackout, grayscale shut-down fade, CRT collapse
- Key techniques: Pixel-exact bevels & 1-bit dither, Zoom-rect window opening, Cursor-driven choreography

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Pixel-exact bevels & 1-bit dither, Zoom-rect window opening, Cursor-driven choreography).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Pixel-exact bevels & 1-bit dither and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "RETRO DESKTOP UI", held for about 1 s.

BUILD RULES
- Suggested tools: Canvas 2D, Pixel art, After Effects. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Retro Desktop UI motion-graphics film (Windows, Icons, Menus, Pointer). Visual style: native-resolution pixels scaled up crisp: 1-bit checker gray and striped title bars, teal desktop with grey 3D bevels and navy captions, then Luna blue glass, green Start and rolling-hill wallpaper. Motion: the cursor is the protagonist: every move is a double-click, drag or menu pull answered by zoom rectangles, inverted highlights and a progress bar. Signature moves: pixel-exact bevels & 1-bit dither, zoom-rect window opening, cursor-driven choreography; transitions: zoom-rect open, dithered dissolve, caption-bar zoom, Solitaire trail cascade, display mode-switch blackout, grayscale shut-down fade, CRT collapse. In the tradition of Xerox Star 8010 (1981) · Apple Macintosh System 1, icons by Susan Kare (1984) · Windows 95 (1995) · Microsoft Solitaire win cascade, Wes Cherry (1990) · Windows XP Luna (2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "RETRO DESKTOP UI". Punchy sound design synced to every cut.
```
