# Morph

*Point-wise shape interpolation · 1974 — · Technique Atlas*

Reference film: `videos/techmorph.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Morph** (Point-wise shape interpolation, 1974 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Computer shape interpolation grew out of the key-frame animation system Nestor Burtnyk and Marceli Wein built at Canada’s National Research Council, which Peter Foldès used to let drawings melt into one another in Hunger (La Faim, 1974). Vector shape tweening became an everyday motion-graphics tool with Flash shape tweens and After Effects path animation; image morphing, which also warps pixels, followed in film effects from the late 1980s.
- Study these reference works: Hunger / La Faim (Peter Foldès, National Film Board of Canada, 1974) · Willow (Ron Howard, 1988; ILM morph sequence) · Black or White, Michael Jackson (music video, 1991; PDI face morphs)
- Motion DNA: Every point of one outline travels in a straight line to its partner on the next, all on the same eased clock, so the silhouette flows rather than cuts. Four morphs on the bar: Token to circle, circle to bar, bar to the letter M, then back to the Token on an overshooting ease that lets the points spring past their targets and settle.
- Visual DNA: The Technique Atlas stage: warm paper, a faint grid, the orange Token. Ink dots mark every eighth sample point, point 0 ringed; dashed ghosts of source and target outlines with thin travel lines between partner points; a strip of the five shapes along the top.
- Signature transitions: Point-wise morph between closed outlines; the hole drifts, shrinks to a point and grows back
- Key techniques: Arc-length resampling, Matched point order, Interpolated hole

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Arc-length resampling, Matched point order, Interpolated hole).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Arc-length resampling and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "MORPH", held for about 1 s.

BUILD RULES
- Suggested tools: After Effects path keyframes / shape layers, Flash shape tweens, Canvas 2D: arc-length resampling and per-point lerp. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- Loopable: make the last frame cut cleanly back to the first.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Morph motion-graphics film (Point-wise shape interpolation). Visual style: the Technique Atlas stage: warm paper, a faint grid, the orange Token. Ink dots mark every eighth sample point, point 0 ringed; dashed ghosts of source and target outlines with thin travel lines between partner points; a strip of the five shapes along the top. Motion: every point of one outline travels in a straight line to its partner on the next, all on the same eased clock, so the silhouette flows rather than cuts. Four morphs on the bar: Token to circle, circle to bar, bar to the letter M, then back to the Token on an overshooting ease that lets the points spring past their targets and settle. Signature moves: arc-length resampling, matched point order, interpolated hole; transitions: point-wise morph between closed outlines; the hole drifts, shrinks to a point and grows back. In the tradition of Hunger / La Faim (Peter Foldès, National Film Board of Canada, 1974) · Willow (Ron Howard, 1988; ILM morph sequence) · Black or White, Michael Jackson (music video, 1991; PDI face morphs). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "MORPH". Punchy sound design synced to every cut.
```
