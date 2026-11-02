# Feedback

*Each frame is the last frame, transformed, under the new one · 1960s — · Technique Atlas*

Reference film: `videos/techfeedback.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Feedback** (Each frame is the last frame, transformed, under the new one, 1960s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Pointing a video camera at the monitor it feeds makes a loop in which every frame contains the last one, scaled, rotated and dimmed by the camera’s framing — the tunnel explored by video artists such as Steina and Woody Vasulka in the late 1960s and early 1970s. The BBC’s Doctor Who titles (from 1963) were built on howl-round feedback, and digital tools turned the loop into a parameter set: a feedback buffer redrawn every frame with a scale, rotation, offset and decay, as in MilkDrop music visualisers and VJ software.
- Study these reference works: Doctor Who opening titles (Bernard Lodge, BBC, 1963; howl-round feedback) · Steina and Woody Vasulka, video feedback works (The Kitchen, New York, early 1970s) · MilkDrop (Ryan Geiss, Winamp visualiser, 2001)
- Motion DNA: The Token flies a Lissajous loop at constant pace; everything else is the loop’s echo. Four regimes on the bar lines, each eased in over a quarter-second: no transform leaves plain fading trails, ×1.024 per frame blows them into a tunnel, ×0.975 with −6° a frame (against the Token’s orbit) winds them into an inward spiral, and ×1.03 with −2.2° and an offset sends a drifting vortex out from a shifted vanishing point.
- Visual DNA: The Technique Atlas stage with a framed monitor on the right; dozens of Token generations fading from orange to blue and back by birth frame, each inked at its edge; dashed rectangles tracing the monitor frame nested inside itself; a left column with the live parameters (scale, rotate, offset, decay, generations) and a loop diagram with a pulse running round it.
- Signature transitions: Parameter crossfades between feedback regimes; no cuts
- Key techniques: Frame-to-frame transform, Decay per generation, Closed-form reconstruction

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Frame-to-frame transform, Decay per generation, Closed-form reconstruction).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Frame-to-frame transform and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "FEEDBACK", held for about 1 s.

BUILD RULES
- Suggested tools: Camera pointed at its own monitor (analog howl-round), Feedback buffer in TouchDesigner / MilkDrop / After Effects echo, Canvas 2D: last N generations redrawn under accumulated affine transforms and decays. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Feedback motion-graphics film (Each frame is the last frame, transformed, under the new one). Visual style: the Technique Atlas stage with a framed monitor on the right; dozens of Token generations fading from orange to blue and back by birth frame, each inked at its edge; dashed rectangles tracing the monitor frame nested inside itself; a left column with the live parameters (scale, rotate, offset, decay, generations) and a loop diagram with a pulse running round it. Motion: the Token flies a Lissajous loop at constant pace; everything else is the loop’s echo. Four regimes on the bar lines, each eased in over a quarter-second: no transform leaves plain fading trails, ×1.024 per frame blows them into a tunnel, ×0.975 with −6° a frame (against the Token’s orbit) winds them into an inward spiral, and ×1.03 with −2.2° and an offset sends a drifting vortex out from a shifted vanishing point. Signature moves: frame-to-frame transform, decay per generation, closed-form reconstruction; transitions: parameter crossfades between feedback regimes; no cuts. In the tradition of Doctor Who opening titles (Bernard Lodge, BBC, 1963; howl-round feedback) · Steina and Woody Vasulka, video feedback works (The Kitchen, New York, early 1970s) · MilkDrop (Ryan Geiss, Winamp visualiser, 2001). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "FEEDBACK". Punchy sound design synced to every cut.
```
