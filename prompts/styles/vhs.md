# VHS Analog Video

*Home Video on Tape · 1976 — · Analog, Physical & Stop Motion*

Reference film: `videos/vhs.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **VHS Analog Video** (Home Video on Tape, 1976 —; family: Analog, Physical & Stop Motion).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: JVC launched the VHS cassette in Japan in 1976, and by the mid-1980s VHS-C and full-size camcorders had put a video camera in millions of homes. Its colour-under recording keeps luma at roughly 240 lines and squeezes chroma into a narrow band, so colours smear and lag; helical-scan heads leave tracking bands and switching noise. Analog-horror and retro music videos later rebuilt these faults on purpose.
- Study these reference works: JVC HR-3300 "Vidstar" (first VHS deck, 1976) · Videodrome (David Cronenberg, 1983) · America's Funniest Home Videos (ABC, 1989 —) · V/H/S (2012) · Too Many Cooks (Casper Kelly, Adult Swim, 2014) · Local 58 (Kris Straub, 2015)
- Motion DNA: Handheld drift and a slow camcorder zoom, interrupted by the machine: picture rolls in after PLAY, tracking bands crawl through, the tape searches backwards with noise bars, and PAUSE freezes a jittering frame.
- Visual DNA: Soft, haloed luma with colours smeared to the right of their objects, warm tungsten light and an on-camera hotspot, a burned-in camcorder date stamp, torn bottom lines, white dropout streaks, and a razor-sharp VCR OSD floating on top.
- Signature transitions: Blue-back to PLAY roll, tracking slip, chroma loss, rewind search, pause freeze
- Key techniques: YIQ chroma bleed & delay, Tracking error & head-switching noise, Timebase wobble & dropouts, Crisp VCR on-screen display

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (YIQ chroma bleed & delay, Tracking error & head-switching noise, Timebase wobble & dropouts, Crisp VCR on-screen display).
- 5.0–8.0 s  Climax: the most spectacular moment, built on YIQ chroma bleed & delay and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "VHS ANALOG VIDEO", held for about 1 s.

BUILD RULES
- Suggested tools: Camcorder + VCR (dub generations), After Effects (VHS presets, ntscQT), Canvas 2D (per-line YIQ decode). If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second VHS Analog Video motion-graphics film (Home Video on Tape). Visual style: soft, haloed luma with colours smeared to the right of their objects, warm tungsten light and an on-camera hotspot, a burned-in camcorder date stamp, torn bottom lines, white dropout streaks, and a razor-sharp VCR OSD floating on top. Motion: handheld drift and a slow camcorder zoom, interrupted by the machine: picture rolls in after PLAY, tracking bands crawl through, the tape searches backwards with noise bars, and PAUSE freezes a jittering frame. Signature moves: yiq chroma bleed & delay, tracking error & head-switching noise, timebase wobble & dropouts, crisp vcr on-screen display; transitions: blue-back to PLAY roll, tracking slip, chroma loss, rewind search, pause freeze. In the tradition of JVC HR-3300 "Vidstar" (first VHS deck, 1976) · Videodrome (David Cronenberg, 1983) · America's Funniest Home Videos (ABC, 1989 —) · V/H/S (2012) · Too Many Cooks (Casper Kelly, Adult Swim, 2014) · Local 58 (Kris Straub, 2015). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "VHS ANALOG VIDEO". Punchy sound design synced to every cut.
```
