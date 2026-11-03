# Pan & Tilt

*The camera turns on a fixed point · 1890s — · Technique Atlas*

Reference film: `videos/techpan.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Pan & Tilt** (The camera turns on a fixed point, 1890s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Panning, short for panorama, arrived when cameras were first mounted on heads that could turn: early actuality films around 1896–1900 swept across crowds and landscapes, and geared and later fluid heads made smooth pans and tilts routine. Because the camera only rotates (ideally about the lens’s nodal point) nothing shows parallax; every object shifts by the same angle, which is why panoramas can be stitched and why a fast pan at 24 frames a second strobes. Cinematographers’ handbooks such as the American Cinematographer Manual give pan-speed tables; the common rule of thumb is that an object should take about seven seconds to cross the frame.
- Study these reference works: The Great Train Robbery (Edwin S. Porter, 1903) · Lawrence of Arabia (David Lean, 1962) · American Cinematographer Manual (ASC, pan-speed tables)
- Motion DNA: A held frame, a slow eased pan right in which every object slides together and a near Token stays locked over a far one, a beat of rest, then a whip back that steps in held 24 fps frames with a ghost of the last, and after a pause a long eased tilt that drops the Tokens out of frame and lifts MOTION into the centre.
- Visual DNA: The Technique Atlas stage as a wide set: pale Token copies along a far wall with faint posts, the ink far Token behind the orange near Token, MOTION high on the wall; a boxed plan view with a rotating orange view cone and fixed rays, swapped for a side view during the tilt, and a camera readout box with speed, pixels per frame and a seven-second meter.
- Signature transitions: Pan, whip pan with strobing, plan view crossfades to side view, tilt up and hold
- Key techniques: Rotation about the nodal point, Screen shift = focal × angle, depth-free, Pan speed vs frame rate

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Rotation about the nodal point, Screen shift = focal × angle, depth-free, Pan speed vs frame rate).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Rotation about the nodal point and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "PAN & TILT", held for about 1 s.

BUILD RULES
- Suggested tools: Fluid or geared head; After Effects one-node camera rotation or 2D position on a panorama, Every object offset by focal length × camera angle, independent of distance, Canvas 2D: cylindrical projection; whip pan sampled at 24 fps with the previous frame ghosted. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Pan & Tilt motion-graphics film (The camera turns on a fixed point). Visual style: the Technique Atlas stage as a wide set: pale Token copies along a far wall with faint posts, the ink far Token behind the orange near Token, MOTION high on the wall; a boxed plan view with a rotating orange view cone and fixed rays, swapped for a side view during the tilt, and a camera readout box with speed, pixels per frame and a seven-second meter. Motion: a held frame, a slow eased pan right in which every object slides together and a near Token stays locked over a far one, a beat of rest, then a whip back that steps in held 24 fps frames with a ghost of the last, and after a pause a long eased tilt that drops the Tokens out of frame and lifts MOTION into the centre. Signature moves: rotation about the nodal point, screen shift = focal × angle, depth-free, pan speed vs frame rate; transitions: pan, whip pan with strobing, plan view crossfades to side view, tilt up and hold. In the tradition of The Great Train Robbery (Edwin S. Porter, 1903) · Lawrence of Arabia (David Lean, 1962) · American Cinematographer Manual (ASC, pan-speed tables). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "PAN & TILT". Punchy sound design synced to every cut.
```
