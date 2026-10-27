# Glassmorphism 3D

*Frosted Depth · 2020 — · 3D & CGI Motion*

Reference film: `videos/glass3d.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Glassmorphism 3D** (Frosted Depth, 2020 —; family: 3D & CGI Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Frosted translucency runs from Windows Vista Aero (2007) and iOS 7 (2013) to macOS Big Sur (2020), when designer Michal Malewicz named “glassmorphism”; 3D renders of floating glass shapes over gradient blobs became its motion signature.
- Study these reference works: Windows Vista Aero Glass (2007) · iOS 7 Control Center (2013) · macOS Big Sur (2020) · Windows 11 Mica / Acrylic (2021) · Apple Liquid Glass (2025)
- Motion DNA: Weightless shapes drift in parallax on soft springs, converge in a swirl and part to reveal a UI card that assembles element by element.
- Visual DNA: Translucent frosted glass with bright rims over vivid blurred gradient blobs, deep soft shadows and gentle grain.
- Signature transitions: Parallax drift, spring pop, converge-and-reveal, light sweep.
- Key techniques: Background snapshot blurred by downsampling, Clipped refraction: magnified + offset copy, Specular rim, chromatic edge, offscreen soft shadows

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Background snapshot blurred by downsampling, Clipped refraction: magnified + offset copy, Specular rim, chromatic edge, offscreen soft shadows).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Background snapshot blurred by downsampling and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "GLASSMORPHISM 3D", held for about 1 s.

BUILD RULES
- Suggested tools: Blender (Cycles glass + transmission), Spline, CSS backdrop-filter, Canvas 2D. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Glassmorphism 3D motion-graphics film (Frosted Depth). Visual style: translucent frosted glass with bright rims over vivid blurred gradient blobs, deep soft shadows and gentle grain. Motion: weightless shapes drift in parallax on soft springs, converge in a swirl and part to reveal a UI card that assembles element by element. Signature moves: background snapshot blurred by downsampling, clipped refraction: magnified + offset copy, specular rim, chromatic edge, offscreen soft shadows; transitions: parallax drift, spring pop, converge-and-reveal, light sweep. In the tradition of Windows Vista Aero Glass (2007) · iOS 7 Control Center (2013) · macOS Big Sur (2020) · Windows 11 Mica / Acrylic (2021) · Apple Liquid Glass (2025). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "GLASSMORPHISM 3D". Punchy sound design synced to every cut.
```
