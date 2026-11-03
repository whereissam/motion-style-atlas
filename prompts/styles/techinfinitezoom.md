# Infinite Zoom

*Self-similar picture, log-space camera · 1904 — · Technique Atlas*

Reference film: `videos/techinfinitezoom.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Infinite Zoom** (Self-similar picture, log-space camera, 1904 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: An infinite zoom needs a picture that contains a scaled copy of itself — a Droste image, so named after the Dutch cocoa tin whose 1904 nurse holds a tin bearing her own picture — and a camera that scales by a constant factor per unit of time, so it moves evenly through log space. Fractal zoom films of the 1980s made it a computer-graphics spectacle; Eames Office’s Powers of Ten (1977) had already paced its journey as a factor of ten every ten seconds, and the rising Shepard–Risset tone is its sonic twin.
- Study these reference works: Powers of Ten (Charles and Ray Eames, 1977) · Droste cocoa tin artwork (1904) · Zoom (Istvan Banyai, picture book, 1995)
- Motion DNA: A held frame, an ease into a constant climb of one level per second — the hole swelling until it becomes the frame and the next Token arrives at the size the last one had — then an ease out that lands exactly on level 8, a frame identical to the first. No acceleration is felt in between, because every second is the same ×4.
- Visual DNA: The Technique Atlas stage seen through a rounded viewport: orange Tokens nested hole within hole, each on its own patch of gridded paper and lettered with its level and ×4^n; a crosshair on the fixed point; a HUD with the zoom factor, depth level, an exponential on a linear axis and a straight climb on a log ruler.
- Signature transitions: Continuous self-similar zoom; the end frame matches the start frame for a seamless loop
- Key techniques: Self-similar nesting, ratio K = 4, Exponential zoom Z = K^L, L linear in time, Aim at the fixed point; wrap L mod 1

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Self-similar nesting, ratio K = 4, Exponential zoom Z = K^L, L linear in time, Aim at the fixed point; wrap L mod 1).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Self-similar nesting, ratio K = 4 and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "INFINITE ZOOM", held for about 1 s.

BUILD RULES
- Suggested tools: Droste / recursive comps zoomed with an exponential scale expression, Fractal explorers and shader zooms in log space, Canvas 2D: draw levels n−2 … n+8 from frac(L), nested hole clips. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Infinite Zoom motion-graphics film (Self-similar picture, log-space camera). Visual style: the Technique Atlas stage seen through a rounded viewport: orange Tokens nested hole within hole, each on its own patch of gridded paper and lettered with its level and ×4^n; a crosshair on the fixed point; a HUD with the zoom factor, depth level, an exponential on a linear axis and a straight climb on a log ruler. Motion: a held frame, an ease into a constant climb of one level per second — the hole swelling until it becomes the frame and the next Token arrives at the size the last one had — then an ease out that lands exactly on level 8, a frame identical to the first. No acceleration is felt in between, because every second is the same ×4. Signature moves: self-similar nesting, ratio k = 4, exponential zoom z = k^l, l linear in time, aim at the fixed point; wrap l mod 1; transitions: continuous self-similar zoom; the end frame matches the start frame for a seamless loop. In the tradition of Powers of Ten (Charles and Ray Eames, 1977) · Droste cocoa tin artwork (1904) · Zoom (Istvan Banyai, picture book, 1995). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "INFINITE ZOOM". Punchy sound design synced to every cut.
```
