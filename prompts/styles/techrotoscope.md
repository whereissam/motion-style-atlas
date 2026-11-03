# Rotoscope

*Tracing over footage, frame by frame · 1915 — · Technique Atlas*

Reference film: `videos/techrotoscope.mp4`

### Build prompt (Claude / any coding model / a motion designer)
```text
You are the director, motion designer, engineer and sound designer of ONE 10-second motion-design film in the style of **Rotoscope** (Tracing over footage, frame by frame, 1915 —; family: Technique Atlas).
The goal is the most classic, yet most stunning reading of this style: award-shortlist / high-end commercial quality. A clean, template-looking result is a fail.

STYLE BRIEF
- Lineage: Max Fleischer patented the rotoscope (filed 1915, granted 1917): a projector threw live-action film one frame at a time onto a glass drawing surface so an animator could trace it, and his brother Dave, filmed in a clown suit, became Koko in the Out of the Inkwell series. Disney traced live reference for Snow White (1937), Ralph Bakshi built whole features on it in the 1970s, and digital roto — Bezier splines keyed frame by frame — became the everyday way to cut mattes in compositing.
- Study these reference works: Out of the Inkwell (Max and Dave Fleischer, 1918–1929) · The Lord of the Rings (Ralph Bakshi, 1978) · A Scanner Darkly (Richard Linklater, 2006)
- Motion DNA: All motion comes from the plate: a tumbling hop that lands once a second, sampled at 24 fps. The roto spline snaps to it on every plate frame; the ink drawings snap on every second frame, so the traced animation steps at 12 drawings a second, with the outline trembling as each drawing is redrawn. The motion stays the same while its source fades away.
- Visual DNA: The Technique Atlas stage with a sheet of animation paper and a peg bar; under it a dim, grainy, vignetted plate with a shaded, motion-blurred Token and a burned-in frame counter. Orange spline with white Bezier handles; ink outlines with a lighter pencil pass, orange and blue onion skins, a drawing number in the corner; a 24-cell frame strip marking the plate frames and the drawings on twos.
- Signature transitions: Plate to light table (a paper veil), plate fade-out, ink-and-paint fill
- Key techniques: Reference plate under the paper, Traced on twos with line boil, Roto spline keyed per frame

FILM STRUCTURE (10.0 s · 1920×1080 · 30 fps)
- 0.0–1.5 s  Hook: open on the single most recognisable element of the style.
- 1.5–5.0 s  Development: bring in the signature techniques one at a time (Reference plate under the paper, Traced on twos with line boil, Roto spline keyed per frame).
- 5.0–8.0 s  Climax: the most spectacular moment, built on Reference plate under the paper and a signature transition.
- 8.0–10.0 s Resolve: a composed final frame with a small title "ROTOSCOPE", held for about 1 s.

BUILD RULES
- Suggested tools: Fleischer rotoscope: projector under a glass drawing table, Digital roto: Bezier spline mattes (Silhouette, Nuke, After Effects Roto), Canvas 2D: a 24 fps plate under 12 fps traced outlines with per-drawing boil. If you write code, make everything procedural (Canvas 2D or WebGL for picture, Web Audio for sound) with no external assets. Make each frame a pure function of time t, and use seeded randomness so any frame can be re-rendered exactly.
- Sound is part of the film: write a score and sound effects whose hits land exactly on the visual events. Keep peaks below 0 dBFS.
- Use the style's real palette, materials and typography, and include at least one detail that only this style would have.
- One-shot: it does not need to loop.
- Reproducibility note: Fully procedural.

DELIVER: the film (or code that renders it), plus a beat sheet listing each event with its timing.
```

### Video-model prompt (Sora / Runway / Kling / Veo)
```text
10-second Rotoscope motion-graphics film (Tracing over footage, frame by frame). Visual style: the Technique Atlas stage with a sheet of animation paper and a peg bar; under it a dim, grainy, vignetted plate with a shaded, motion-blurred Token and a burned-in frame counter. Orange spline with white Bezier handles; ink outlines with a lighter pencil pass, orange and blue onion skins, a drawing number in the corner; a 24-cell frame strip marking the plate frames and the drawings on twos. Motion: all motion comes from the plate: a tumbling hop that lands once a second, sampled at 24 fps. The roto spline snaps to it on every plate frame; the ink drawings snap on every second frame, so the traced animation steps at 12 drawings a second, with the outline trembling as each drawing is redrawn. The motion stays the same while its source fades away. Signature moves: reference plate under the paper, traced on twos with line boil, roto spline keyed per frame; transitions: plate to light table (a paper veil), plate fade-out, ink-and-paint fill. In the tradition of Out of the Inkwell (Max and Dave Fleischer, 1918–1929) · The Lord of the Rings (Ralph Bakshi, 1978) · A Scanner Darkly (Richard Linklater, 2006). Award-winning motion design, crisp detail, 16:9, 1920×1080. It ends on a clean title card reading "ROTOSCOPE". Punchy sound design synced to every cut.
```
