# Double Exposure

*Two exposures, one frame · 1850s — · Technique Atlas*

Reference film: `videos/techdoubleexposure.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Double Exposure** (Two exposures, one frame, 1850s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Exposing the same plate or frame twice adds the light of both images: whatever was dark in one shows the other. Victorian photographers used it for “spirit” photographs, and Georges Méliès, rewinding his camera and masking parts of the frame, built trick films on it from 1898. In film it became the superimposition and the dissolve; digital compositing turned it into blend modes, where add (linear dodge) and screen reproduce the light-adding of a double exposure and multiply the sandwiching of two transparencies.
- Study these reference works: The Man with the Rubber Head / L’Homme à la tête en caoutchouc (Georges Méliès, 1901) · The Phantom Carriage / Körkarlen (Victor Sjöström, 1921) · True Detective (HBO, 2014; title sequence by Elastic)
- Motion DNA: The exposures barely move — a slow drift and sway in each — because the technique is in the combine, not the motion. Every two seconds a new pair is shot on the beat: exposure 1 flashes, exposure 2 half a beat later, and the result develops a beat after that under a new blend mode; the silhouette pass holds for the last three seconds with its texture scrolling inside the Token.
- Visual DNA: The Technique Atlas stage with three framed panels: exposure 1 and exposure 2 stacked on the left, joined by + and = to a large result. Near-black exposures for add and screen, paper for multiply, a black Token on white for the silhouette; blue light bars and the word MOTION as the second exposure; a mode strip, a crosshair probe with live RGB readouts and the blend formula under the result.
- Signature transitions: Shutter flash per exposure; the result re-develops under each new blend mode
- Key techniques: Add · screen · multiply, Dark areas take the other exposure, Silhouette as matte

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Add · screen · multiply, Dark areas take the other exposure, Silhouette as matte).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Add · screen · multiply and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "DOUBLE EXPOSURE", held for about 1 s.

BUILD RULES
- Suggested tools: In-camera: rewind and re-expose the same frame, Optical printer superimposition / After Effects blend modes (Add, Screen, Multiply), Canvas 2D: globalCompositeOperation lighter, screen and multiply on offscreen exposures. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Double Exposure motion-graphics film (Two exposures, one frame). Visual style: the Technique Atlas stage with three framed panels: exposure 1 and exposure 2 stacked on the left, joined by + and = to a large result. Near-black exposures for add and screen, paper for multiply, a black Token on white for the silhouette; blue light bars and the word MOTION as the second exposure; a mode strip, a crosshair probe with live RGB readouts and the blend formula under the result. Motion: the exposures barely move — a slow drift and sway in each — because the technique is in the combine, not the motion. Every two seconds a new pair is shot on the beat: exposure 1 flashes, exposure 2 half a beat later, and the result develops a beat after that under a new blend mode; the silhouette pass holds for the last three seconds with its texture scrolling inside the Token. Signature moves: add · screen · multiply, dark areas take the other exposure, silhouette as matte; transitions: shutter flash per exposure; the result re-develops under each new blend mode. In the tradition of The Man with the Rubber Head / L’Homme à la tête en caoutchouc (Georges Méliès, 1901) · The Phantom Carriage / Körkarlen (Victor Sjöström, 1921) · True Detective (HBO, 2014; title sequence by Elastic). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "DOUBLE EXPOSURE". Punchy sound design synced to every cut.
```
