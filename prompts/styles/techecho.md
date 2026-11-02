# Echo

*The layer, composited with itself from earlier frames · 1880s — · Technique Atlas*

Reference film: `videos/techecho.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Echo** (The layer, composited with itself from earlier frames, 1880s —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Showing several moments of one movement in a single picture goes back to Étienne-Jules Marey’s chronophotographs of the 1880s, and Marcel Duchamp painted it in Nude Descending a Staircase, No. 2 (1912). Norman McLaren put it in motion in Pas de deux (1968), optically printing each dancer over delayed copies of themselves. Compositing software turned it into an effect: After Effects’ Echo samples the layer at fixed time offsets, with an echo time, a number of echoes, a starting intensity, a decay and an operator that decides how the copies combine.
- Study these reference works: Étienne-Jules Marey, chronophotographs (1880s) · Nude Descending a Staircase, No. 2 (Marcel Duchamp, 1912) · Pas de deux (Norman McLaren, National Film Board of Canada, 1968)
- Motion DNA: The source never changes — one even figure-eight — and the effect only resamples it. Echoes switch on one at a time over a bar and a half, the echo time eases from −2 to −8 frames so a tight smear opens into a spaced chain, the decay drops so the tail dies within a few copies, the operator flips from compositing to adding to maximum on the beat, and when the source eases to a stop the copies arrive one after another and stack on it.
- Visual DNA: The Technique Atlas stage: the orange Token on a figure-eight with up to eight fading copies, burning to pale yellow where added copies overlap; small index labels on each echo while it is spread; an effect-controls panel top right with the active parameter marked; a layer-time strip of frame ticks and echo sample bars, bar height = opacity.
- Signature transitions: Parameter changes on the beat; operator switches as hard cuts; the trail collapses onto the stopped source
- Key techniques: Echo k = layer at t + k × echo time, Opacity = intensity × decay^k, Echo operator: back · add · maximum

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Echo k = layer at t + k × echo time, Opacity = intensity × decay^k, Echo operator: back · add · maximum).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Echo k = layer at t + k × echo time and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ECHO", held for about 1 s.

BUILD RULES
- Suggested tools: Optical printing of delayed multiple exposures, After Effects Echo effect / Nuke TimeEcho / frame-blend trails, Canvas 2D: each echo redrawn from the closed-form path at t + k × echo time into its own layer, composited with lighter / lighten / source-over. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Echo motion-graphics film (The layer, composited with itself from earlier frames). Visual style: the Technique Atlas stage: the orange Token on a figure-eight with up to eight fading copies, burning to pale yellow where added copies overlap; small index labels on each echo while it is spread; an effect-controls panel top right with the active parameter marked; a layer-time strip of frame ticks and echo sample bars, bar height = opacity. Motion: the source never changes — one even figure-eight — and the effect only resamples it. Echoes switch on one at a time over a bar and a half, the echo time eases from −2 to −8 frames so a tight smear opens into a spaced chain, the decay drops so the tail dies within a few copies, the operator flips from compositing to adding to maximum on the beat, and when the source eases to a stop the copies arrive one after another and stack on it. Signature moves: echo k = layer at t + k × echo time, opacity = intensity × decay^k, echo operator: back · add · maximum; transitions: parameter changes on the beat; operator switches as hard cuts; the trail collapses onto the stopped source. In the tradition of Étienne-Jules Marey, chronophotographs (1880s) · Nude Descending a Staircase, No. 2 (Marcel Duchamp, 1912) · Pas de deux (Norman McLaren, National Film Board of Canada, 1968). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ECHO". Punchy sound design synced to every cut.
```
