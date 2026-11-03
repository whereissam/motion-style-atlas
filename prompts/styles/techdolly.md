# Dolly

*The camera moves, so perspective changes · 1910s — · Technique Atlas*

Reference film: `videos/techdolly.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Dolly** (The camera moves, so perspective changes, 1910s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: A dolly shot moves the whole camera toward or away from the subject on a wheeled platform, often on track. Because the viewpoint itself travels, near objects grow faster than far ones and the parallax between them changes — which a zoom, magnifying from a fixed point, cannot do. Giovanni Pastrone’s Cabiria (1914) made long tracking moves famous enough that they were called "Cabiria movements"; the zoom lens only became common decades later, and Hitchcock’s Vertigo (1958) combined the two against each other in the dolly zoom.
- Study these reference works: Cabiria (Giovanni Pastrone, 1914) · Vertigo (Alfred Hitchcock, 1958; dolly zoom) · Jaws (Steven Spielberg, 1975; dolly zoom on the beach)
- Motion DNA: A slow, eased push in from 9 m to 3.6 m, a hold, a pull back out; then the same push beside a zoom that keeps the camera parked and racks 24 → 60 mm so the Token grows identically. In the dolly the foreground markers swing outward and swell ×4 while the billboard behind barely grows; in the zoom everything scales together about the centre.
- Visual DNA: The Technique Atlas Token on a gridded floor plane in true perspective, ink marker Tokens in front, ink posts with distance labels and MOTION on a far billboard; paper HUD plates with a top-view map (orange frustum widening or narrowing), camera distance, focal length and magnification bars for near, Token and far.
- Signature transitions: Full-frame dolly shrinks into the left half of a split screen as the zoom panel slides in
- Key techniques: Camera translation, fixed focal length, Magnification ∝ 1 / distance per depth, Matched zoom for comparison

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Camera translation, fixed focal length, Magnification ∝ 1 / distance per depth, Matched zoom for comparison).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Camera translation, fixed focal length and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DOLLY", held for about 1 s.

BUILD RULES
- Suggested tools: Dolly and track, slider, crane or Steadicam on set, Camera translation in Cinema 4D / Blender / After Effects 3D camera, Canvas 2D: pinhole projection x·f/z of a small 3D set, painter-sorted. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Dolly motion-graphics film (The camera moves, so perspective changes). Visual style: the Technique Atlas Token on a gridded floor plane in true perspective, ink marker Tokens in front, ink posts with distance labels and MOTION on a far billboard; paper HUD plates with a top-view map (orange frustum widening or narrowing), camera distance, focal length and magnification bars for near, Token and far. Motion: a slow, eased push in from 9 m to 3.6 m, a hold, a pull back out; then the same push beside a zoom that keeps the camera parked and racks 24 → 60 mm so the Token grows identically. In the dolly the foreground markers swing outward and swell ×4 while the billboard behind barely grows; in the zoom everything scales together about the centre. Signature moves: camera translation, fixed focal length, magnification ∝ 1 / distance per depth, matched zoom for comparison; transitions: full-frame dolly shrinks into the left half of a split screen as the zoom panel slides in. In the tradition of Cabiria (Giovanni Pastrone, 1914) · Vertigo (Alfred Hitchcock, 1958; dolly zoom) · Jaws (Steven Spielberg, 1975; dolly zoom on the beach). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DOLLY". Punchy sound design synced to every cut.
```
